import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  style: text("style").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  characterId: integer("character_id").references(() => characters.id),
  type: text("type").notNull(),
  prompt: text("prompt").notNull(),
  referenceImageUrl: text("reference_image_url"),
  resultImageUrl: text("result_image_url").notNull(),
  creditsUsed: integer("credits_used").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  credits: integer("credits").notNull().default(3),
  tier: text("tier").notNull().default("free"),
  authorName: text("author_name"),
  genre: text("genre"),
  totalGenerations: integer("total_generations").notNull().default(0),
  bubbleUsesToday: integer("bubble_uses_today").notNull().default(0),
  storyUsesToday: integer("story_uses_today").notNull().default(0),
  lastResetAt: timestamp("last_reset_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  impUid: text("imp_uid").notNull(),
  merchantUid: text("merchant_uid").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  productType: text("product_type").notNull(),
  creditsAdded: integer("credits_added").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trendingAccounts = pgTable("trending_accounts", {
  id: serial("id").primaryKey(),
  rankType: text("rank_type").notNull(),
  rank: integer("rank").notNull(),
  handle: varchar("handle", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  followers: integer("followers").notNull().default(0),
  avgViews: integer("avg_views").notNull().default(0),
  profileImageUrl: text("profile_image_url"),
  description: text("description"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertTrendingAccountSchema = createInsertSchema(trendingAccounts).omit({
  id: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertGenerationSchema = createInsertSchema(generations).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const generateCharacterSchema = z.object({
  prompt: z.string().min(3, "Description must be at least 3 characters"),
  style: z.enum(["simple-line", "cute-animal", "doodle", "minimal", "scribble", "ink-sketch"]),
});

export const generatePoseSchema = z.object({
  characterId: z.number(),
  prompt: z.string().min(3, "Pose description must be at least 3 characters"),
  referenceImageData: z.string().optional(),
});

export const generateBackgroundSchema = z.object({
  sourceImageData: z.string().min(1, "Source image is required"),
  backgroundPrompt: z.string().min(3, "Background description must be at least 3 characters"),
  itemsPrompt: z.string().optional(),
  characterId: z.number().optional(),
});

export const adMatchSchema = z.object({
  genre: z.string().min(1, "Genre is required"),
  followers: z.string().min(1, "Follower count is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  contentStyle: z.string().min(1, "Content style is required"),
  postFrequency: z.string().min(1, "Posting frequency is required"),
  engagement: z.string().min(1, "Engagement rate is required"),
});

export const creatorProfileSchema = z.object({
  authorName: z.string().min(1, "Author name is required").max(30),
  genre: z.enum(["daily", "gag", "romance", "fantasy"]),
});

export const storyScriptSchema = z.object({
  topic: z.string().min(2, "주제를 2글자 이상 입력해주세요"),
  panelCount: z.number().min(1).max(10),
  posePrompt: z.string().optional(),
  expressionPrompt: z.string().optional(),
  itemPrompt: z.string().optional(),
  backgroundPrompt: z.string().optional(),
});

export const topicSuggestSchema = z.object({
  genre: z.string().optional(),
});

export type StoryScriptRequest = z.infer<typeof storyScriptSchema>;
export type TopicSuggestRequest = z.infer<typeof topicSuggestSchema>;

export interface StoryBubbleScript {
  text: string;
  style?: "handwritten" | "linedrawing" | "wobbly";
}

export interface StoryPanelScript {
  top: string;
  bottom: string;
  bubbles: StoryBubbleScript[];
}

export interface StoryScriptResponse {
  panels: StoryPanelScript[];
}

export type CreatorProfile = z.infer<typeof creatorProfileSchema>;

export const bubbleProjects = pgTable("bubble_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  canvasData: text("canvas_data").notNull(),
  editorType: text("editor_type").notNull().default("bubble"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBubbleProjectSchema = createInsertSchema(bubbleProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBubbleProjectSchema = z.object({
  name: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional(),
  canvasData: z.string().optional(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type BubbleProject = typeof bubbleProjects.$inferSelect;
export type InsertBubbleProject = z.infer<typeof insertBubbleProjectSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type UserCredits = typeof userCredits.$inferSelect;
export type TrendingAccount = typeof trendingAccounts.$inferSelect;
export type InsertTrendingAccount = z.infer<typeof insertTrendingAccountSchema>;
