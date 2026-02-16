import {
  users, type UpsertUser,
  characters, generations, userCredits, trendingAccounts, bubbleProjects, payments,
  type Character, type InsertCharacter,
  type Generation, type InsertGeneration,
  type UserCredits, type TrendingAccount, type InsertTrendingAccount,
  type CreatorProfile, type BubbleProject, type InsertBubbleProject,
  type Payment, type InsertPayment,
} from "@shared/schema";
import { requireDb } from "./db";
import { eq, desc, sql, and, asc } from "drizzle-orm";

export interface IStorage {
  ensureUser(data: UpsertUser): Promise<void>;

  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUser(userId: string): Promise<Character[]>;
  createCharacter(data: InsertCharacter): Promise<Character>;

  getGenerationsByUser(userId: string): Promise<Generation[]>;
  createGeneration(data: InsertGeneration): Promise<Generation>;

  getUserCredits(userId: string): Promise<UserCredits>;
  deductCredit(userId: string): Promise<boolean>;
  ensureUserCredits(userId: string): Promise<UserCredits>;
  deductBubbleUse(userId: string): Promise<boolean>;
  deductStoryUse(userId: string): Promise<boolean>;

  updateUserTier(userId: string, tier: string): Promise<UserCredits>;
  addCredits(userId: string, amount: number): Promise<UserCredits>;

  updateCreatorProfile(userId: string, profile: CreatorProfile): Promise<UserCredits>;
  incrementTotalGenerations(userId: string): Promise<void>;
  getGenerationCount(userId: string): Promise<number>;

  getTrendingAccounts(rankType: string): Promise<TrendingAccount[]>;
  getAllTrending(): Promise<{ latest: TrendingAccount[]; mostViewed: TrendingAccount[]; realtime: TrendingAccount[] }>;

  createPayment(data: InsertPayment): Promise<Payment>;
  getPaymentByImpUid(impUid: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;

  createBubbleProject(data: InsertBubbleProject): Promise<BubbleProject>;
  getBubbleProjectsByUser(userId: string): Promise<BubbleProject[]>;
  getBubbleProject(id: number, userId: string): Promise<BubbleProject | undefined>;
  updateBubbleProject(id: number, userId: string, data: Partial<Pick<BubbleProject, "name" | "thumbnailUrl" | "canvasData">>): Promise<BubbleProject | undefined>;
  deleteBubbleProject(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private getDb() {
    return requireDb().db;
  }

  async ensureUser(data: UpsertUser): Promise<void> {
    const db = this.getDb();
    const [existing] = await db.select().from(users).where(eq(users.id, data.id!));
    if (existing) {
      await db.update(users)
        .set({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          profileImageUrl: data.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.id!));
    } else {
      await db.insert(users).values(data);
    }
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const db = this.getDb();
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async getCharactersByUser(userId: string): Promise<Character[]> {
    const db = this.getDb();
    return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.createdAt));
  }

  async createCharacter(data: InsertCharacter): Promise<Character> {
    const db = this.getDb();
    const [character] = await db.insert(characters).values(data).returning();
    return character;
  }

  async getGenerationsByUser(userId: string): Promise<Generation[]> {
    const db = this.getDb();
    return db.select().from(generations).where(eq(generations.userId, userId)).orderBy(desc(generations.createdAt));
  }

  async createGeneration(data: InsertGeneration): Promise<Generation> {
    const db = this.getDb();
    const [generation] = await db.insert(generations).values(data).returning();
    return generation;
  }

  async ensureUserCredits(userId: string): Promise<UserCredits> {
    const db = this.getDb();
    const [existing] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
    if (existing) {
      const now = new Date();
      const lastReset = new Date(existing.lastResetAt);
      const isNewMonth = now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastReset.getUTCFullYear();

      if (isNewMonth) {
        // Reset monthly limits
        const updates: any = {
          bubbleUsesToday: 0,
          storyUsesToday: 0,
          lastResetAt: now
        };
        // Reset free tier generations to 3
        if (existing.tier === "free") {
          updates.credits = 3;
        }
        const [updated] = await db.update(userCredits)
          .set(updates)
          .where(eq(userCredits.userId, userId))
          .returning();
        return updated;
      }
      return existing;
    }

    const [created] = await db.insert(userCredits)
      .values({ userId, credits: 3, tier: "free" })
      .returning();
    return created;
  }

  async getUserCredits(userId: string): Promise<UserCredits> {
    return this.ensureUserCredits(userId);
  }

  async deductCredit(userId: string): Promise<boolean> {
    const credits = await this.ensureUserCredits(userId);
    if (credits.tier === "pro") return true;
    if (credits.credits <= 0) return false;

    const db = this.getDb();
    await db.update(userCredits)
      .set({ credits: credits.credits - 1 })
      .where(eq(userCredits.userId, userId));
    return true;
  }

  async deductBubbleUse(userId: string): Promise<boolean> {
    const credits = await this.ensureUserCredits(userId);
    if (credits.tier === "pro") return true;
    if (credits.bubbleUsesToday >= 3) return false;
    const db = this.getDb();
    await db.update(userCredits)
      .set({ bubbleUsesToday: credits.bubbleUsesToday + 1 })
      .where(eq(userCredits.userId, userId));
    return true;
  }

  async deductStoryUse(userId: string): Promise<boolean> {
    const credits = await this.ensureUserCredits(userId);
    if (credits.tier === "pro") return true;
    if (credits.storyUsesToday >= 3) return false;
    const db = this.getDb();
    await db.update(userCredits)
      .set({ storyUsesToday: credits.storyUsesToday + 1 })
      .where(eq(userCredits.userId, userId));
    return true;
  }

  async updateUserTier(userId: string, tier: string): Promise<UserCredits> {
    await this.ensureUserCredits(userId);
    const db = this.getDb();
    const [updated] = await db.update(userCredits)
      .set({ tier })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updated;
  }

  async addCredits(userId: string, amount: number): Promise<UserCredits> {
    const credits = await this.ensureUserCredits(userId);
    const db = this.getDb();
    const [updated] = await db.update(userCredits)
      .set({ credits: credits.credits + amount })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updated;
  }

  async updateCreatorProfile(userId: string, profile: CreatorProfile): Promise<UserCredits> {
    await this.ensureUserCredits(userId);
    const db = this.getDb();
    const [updated] = await db.update(userCredits)
      .set({ authorName: profile.authorName, genre: profile.genre })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updated;
  }

  async incrementTotalGenerations(userId: string): Promise<void> {
    await this.ensureUserCredits(userId);
    const db = this.getDb();
    await db.update(userCredits)
      .set({ totalGenerations: sql`${userCredits.totalGenerations} + 1` })
      .where(eq(userCredits.userId, userId));
  }

  async getGenerationCount(userId: string): Promise<number> {
    const credits = await this.ensureUserCredits(userId);
    return credits.totalGenerations;
  }

  async getTrendingAccounts(rankType: string): Promise<TrendingAccount[]> {
    const db = this.getDb();
    return db.select().from(trendingAccounts)
      .where(eq(trendingAccounts.rankType, rankType))
      .orderBy(asc(trendingAccounts.rank));
  }

  async getAllTrending(): Promise<{ latest: TrendingAccount[]; mostViewed: TrendingAccount[]; realtime: TrendingAccount[] }> {
    const db = this.getDb();
    const all: TrendingAccount[] = await db.select().from(trendingAccounts).orderBy(asc(trendingAccounts.rank));
    return {
      latest: all.filter((a: TrendingAccount) => a.rankType === "latest"),
      mostViewed: all.filter((a: TrendingAccount) => a.rankType === "most_viewed"),
      realtime: all.filter((a: TrendingAccount) => a.rankType === "realtime"),
    };
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const db = this.getDb();
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async getPaymentByImpUid(impUid: string): Promise<Payment | undefined> {
    const db = this.getDb();
    const [payment] = await db.select().from(payments).where(eq(payments.impUid, impUid));
    return payment || undefined;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const db = this.getDb();
    const [updated] = await db.update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return updated || undefined;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const db = this.getDb();
    return db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createBubbleProject(data: InsertBubbleProject): Promise<BubbleProject> {
    const db = this.getDb();
    const [project] = await db.insert(bubbleProjects).values(data).returning();
    return project;
  }

  async getBubbleProjectsByUser(userId: string): Promise<BubbleProject[]> {
    const db = this.getDb();
    return db.select().from(bubbleProjects)
      .where(eq(bubbleProjects.userId, userId))
      .orderBy(desc(bubbleProjects.updatedAt));
  }

  async getBubbleProject(id: number, userId: string): Promise<BubbleProject | undefined> {
    const db = this.getDb();
    const [project] = await db.select().from(bubbleProjects)
      .where(and(eq(bubbleProjects.id, id), eq(bubbleProjects.userId, userId)));
    return project || undefined;
  }

  async updateBubbleProject(id: number, userId: string, data: Partial<Pick<BubbleProject, "name" | "thumbnailUrl" | "canvasData">>): Promise<BubbleProject | undefined> {
    const db = this.getDb();
    const [updated] = await db.update(bubbleProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(bubbleProjects.id, id), eq(bubbleProjects.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteBubbleProject(id: number, userId: string): Promise<boolean> {
    const db = this.getDb();
    const result = await db.delete(bubbleProjects)
      .where(and(eq(bubbleProjects.id, id), eq(bubbleProjects.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
