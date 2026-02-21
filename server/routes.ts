import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, type AuthRequest } from "./authMiddleware";
import { generateCharacterImage, generatePoseImage, generateWithBackground } from "./imageGen";
import { generateAIPrompt, analyzeAdMatch, enhanceBio, generateStoryScripts, suggestStoryTopics } from "./aiText";
import { generateCharacterSchema, generatePoseSchema, generateBackgroundSchema, adMatchSchema, creatorProfileSchema, storyScriptSchema, topicSuggestSchema, updateBubbleProjectSchema } from "@shared/schema";
import axios from "axios";
import { config } from "./config";

// Product prices (must match client-side pricing)
const PRODUCT_PRICES = {
  pro: 19900,
  credits: 4900,
} as const;

async function getPortoneAccessToken(): Promise<string> {
  const response = await axios.post("https://api.iamport.kr/users/getToken", {
    imp_key: config.portoneApiKey,
    imp_secret: config.portoneApiSecret,
  });
  return response.data.response.access_token;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/auth/user", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = req.supabaseUser;
      
      const email = user.email || null;
      const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.name || null;
      const lastName = user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null;
      const profileImageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // 🔥 핵심 추가: 로그인 통과한 유저를 내 DB의 users 테이블에도 확실히 저장해줌!
      await storage.ensureUser({
        id: userId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });

      res.json({
        id: userId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/generate-character", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const parsed = generateCharacterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const { prompt, style } = parsed.data;

      const FREE_STYLES = ["simple-line", "minimal", "doodle"];
      const credits = await storage.getUserCredits(userId);
      if (credits.tier !== "pro" && !FREE_STYLES.includes(style)) {
        return res.status(403).json({ message: "이 스타일은 Pro 멤버십 전용입니다. 심플 라인, 미니멀, 낙서풍 스타일은 무료로 사용 가능합니다." });
      }

      const canGenerate = await storage.deductCredit(userId);
      if (!canGenerate) {
        return res.status(403).json({ message: "이번 달의 무료 생성 횟수를 모두 사용했습니다. 다음 달에 다시 시도해주세요." });
      }

      const imageDataUrl = await generateCharacterImage(prompt, style);

      const character = await storage.createCharacter({
        userId,
        prompt,
        style,
        imageUrl: imageDataUrl,
      });

      await storage.createGeneration({
        userId,
        characterId: character.id,
        type: "character",
        prompt,
        resultImageUrl: imageDataUrl,
        creditsUsed: 1,
      });

      await storage.incrementTotalGenerations(userId);

      res.json({ characterId: character.id, imageUrl: imageDataUrl });
    } catch (error: any) {
      console.error("Character generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate character" });
    }
  });

  app.post("/api/generate-pose", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const parsed = generatePoseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const { characterId, prompt, referenceImageData } = parsed.data;

      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      if (character.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const canGenerate = await storage.deductCredit(userId);
      if (!canGenerate) {
        return res.status(403).json({ message: "이번 달의 무료 생성 횟수를 모두 사용했습니다. 다음 달에 다시 시도해주세요." });
      }

      const imageDataUrl = await generatePoseImage(character, prompt, referenceImageData);

      await storage.createGeneration({
        userId,
        characterId,
        type: "pose",
        prompt,
        referenceImageUrl: referenceImageData || null,
        resultImageUrl: imageDataUrl,
        creditsUsed: 1,
      });

      await storage.incrementTotalGenerations(userId);

      res.json({ imageUrl: imageDataUrl });
    } catch (error: any) {
      console.error("Pose generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate pose" });
    }
  });

  app.post("/api/generate-background", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const parsed = generateBackgroundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const { sourceImageData, backgroundPrompt, itemsPrompt, characterId } = parsed.data;

      if (characterId) {
        const character = await storage.getCharacter(characterId);
        if (!character) {
          return res.status(404).json({ message: "Character not found" });
        }
        if (character.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const canGenerate = await storage.deductCredit(userId);
      if (!canGenerate) {
        return res.status(403).json({ message: "이번 달의 무료 생성 횟수를 모두 사용했습니다. 다음 달에 다시 시도해주세요." });
      }

      const imageDataUrl = await generateWithBackground(sourceImageData, backgroundPrompt, itemsPrompt);

      const fullPrompt = itemsPrompt
        ? `Background: ${backgroundPrompt}, Items: ${itemsPrompt}`
        : `Background: ${backgroundPrompt}`;

      await storage.createGeneration({
        userId,
        characterId: characterId || null,
        type: "background",
        prompt: fullPrompt,
        referenceImageUrl: null,
        resultImageUrl: imageDataUrl,
        creditsUsed: 1,
      });

      await storage.incrementTotalGenerations(userId);

      res.json({ imageUrl: imageDataUrl });
    } catch (error: any) {
      console.error("Background generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate background" });
    }
  });

  app.post("/api/ad-match", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const credits = await storage.getUserCredits(userId);
      if (credits.tier !== "pro") {
        return res.status(403).json({ message: "Pro membership required to use Advertiser Matching AI" });
      }

      const parsed = adMatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const result = await analyzeAdMatch(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("Ad match error:", error);
      res.status(500).json({ message: error.message || "Failed to analyze ad match" });
    }
  });

  app.post("/api/ai-prompt", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { type, context } = req.body;
      if (!type || !["character", "pose", "background"].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
      }
      const result = await generateAIPrompt(type, context);
      res.json({ prompt: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate AI prompt" });
    }
  });

  app.post("/api/enhance-bio", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { bio, profileName, category, followers, engagement } = req.body;
      if (!bio || typeof bio !== "string" || bio.trim().length < 3) {
        return res.status(400).json({ message: "Please write at least a short description to enhance." });
      }
      const enhanced = await enhanceBio({ bio, profileName, category, followers, engagement });
      res.json({ enhancedBio: enhanced });
    } catch (error: any) {
      console.error("Bio enhance error:", error);
      res.status(500).json({ message: error.message || "Failed to enhance bio" });
    }
  });

  app.get("/api/characters", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const chars = await storage.getCharactersByUser(userId);
      res.json(chars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.get("/api/characters/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      const character = await storage.getCharacter(id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      if (character.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  app.get("/api/gallery", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const gens = await storage.getGenerationsByUser(userId);
      res.json(gens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.get("/api/usage", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const credits = await storage.getUserCredits(userId);
      const isPro = credits.tier === "pro";
      res.json({
        credits: credits.credits,
        tier: credits.tier,
        authorName: credits.authorName,
        genre: credits.genre,
        totalGenerations: credits.totalGenerations,
        dailyFreeCredits: isPro ? -1 : 3,
        bubbleUsesToday: credits.bubbleUsesToday,
        storyUsesToday: credits.storyUsesToday,
        maxBubbleUses: isPro ? -1 : 3,
        maxStoryUses: isPro ? -1 : 3,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  app.post("/api/creator-profile", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const parsed = creatorProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const updated = await storage.updateCreatorProfile(userId, parsed.data);
      res.json({ authorName: updated.authorName, genre: updated.genre });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/trending", async (_req, res) => {
    try {
      const data = await storage.getAllTrending();
      res.json(data);
    } catch (error: any) {
      console.error("Trending fetch error:", error);
      res.json({
        latest: [],
        mostViewed: [],
        realtime: [],
      });
    }
  });

  app.post("/api/payment/complete", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { imp_uid, merchant_uid, product_type } = req.body;

      if (!imp_uid || !merchant_uid) {
        return res.status(400).json({ message: "imp_uid와 merchant_uid가 필요합니다." });
      }

      const existingPayment = await storage.getPaymentByImpUid(imp_uid);
      if (existingPayment) {
        return res.status(409).json({ message: "이미 처리된 결제입니다." });
      }

      const accessToken = await getPortoneAccessToken();
      const paymentResponse = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const paymentData = paymentResponse.data.response;
      if (paymentData.status !== "paid") {
        return res.status(400).json({ message: "결제가 완료되지 않았습니다." });
      }

      const amount = paymentData.amount;
      let resolvedProductType = (product_type || "credits") as keyof typeof PRODUCT_PRICES;

      // 금액 검증: 실제 결제 금액과 상품 가격이 일치하는지 확인
      const expectedAmount = PRODUCT_PRICES[resolvedProductType];
      if (!expectedAmount) {
        return res.status(400).json({ message: "유효하지 않은 상품 타입입니다." });
      }

      if (amount !== expectedAmount) {
        console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${amount} for product ${resolvedProductType}`);
        return res.status(400).json({
          message: `결제 금액이 일치하지 않습니다. 예상: ${expectedAmount}원, 실제: ${amount}원`
        });
      }

      // merchant_uid에서 product_type 추출하여 이중 검증
      const merchantProductType = merchant_uid.split("_")[0];
      if (merchantProductType !== resolvedProductType) {
        return res.status(400).json({ message: "주문 정보가 일치하지 않습니다." });
      }

      let creditsToAdd = 0;
      if (resolvedProductType === "pro") {
        await storage.updateUserTier(userId, "pro");
        creditsToAdd = 0;
      } else {
        // 크레딧: 4900원 = 50크레딧
        creditsToAdd = 50;
        if (creditsToAdd > 0) {
          await storage.addCredits(userId, creditsToAdd);
        }
      }

      await storage.createPayment({
        userId,
        impUid: imp_uid,
        merchantUid: merchant_uid,
        amount,
        status: "paid",
        productType: resolvedProductType,
        creditsAdded: creditsToAdd,
      });

      res.json({
        success: true,
        amount,
        creditsAdded: creditsToAdd,
        productType: resolvedProductType,
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message || "결제 검증에 실패했습니다." });
    }
  });

  // PortOne 웹훅 엔드포인트 (결제 상태 변경 알림)
  // 인증 없이 접근 가능하지만, imp_uid로 검증하여 중복 처리 방지
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const { imp_uid, status, merchant_uid } = req.body;

      if (!imp_uid) {
        return res.status(400).json({ message: "imp_uid가 필요합니다." });
      }

      // 이미 처리된 결제인지 확인
      const existingPayment = await storage.getPaymentByImpUid(imp_uid);
      if (existingPayment) {
        // 이미 처리된 경우 상태만 업데이트 (중복 처리 방지)
        if (existingPayment.status !== status) {
          await storage.updatePaymentStatus(existingPayment.id, status);
        }
        return res.json({ success: true, message: "이미 처리된 결제입니다." });
      }

      // 웹훅은 알림용이므로, 실제 결제 처리는 /api/payment/complete에서 처리
      // 여기서는 로깅만 수행
      console.log(`[PortOne Webhook] Payment status update: imp_uid=${imp_uid}, status=${status}, merchant_uid=${merchant_uid}`);

      res.json({ success: true, message: "웹훅 수신 완료" });
    } catch (error: any) {
      console.error("PortOne webhook error:", error);
      // 웹훅 실패 시에도 200을 반환하여 PortOne이 재시도하지 않도록 함
      res.status(200).json({ success: false, message: error.message });
    }
  });

  app.post("/api/story-scripts", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const parsed = storyScriptSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const canUseStory = await storage.deductStoryUse(userId);
      if (!canUseStory) {
        return res.status(403).json({ message: "이번 달의 스토리 에디터 무료 사용 횟수(3회)를 모두 사용했습니다." });
      }

      const result = await generateStoryScripts(parsed.data);
      await storage.incrementTotalGenerations(userId);
      res.json(result);
    } catch (error: any) {
      console.error("Story script generation error:", error);
      res.status(500).json({ message: error.message || "스크립트 생성에 실패했습니다" });
    }
  });

  app.post("/api/story-topic-suggest", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const parsed = topicSuggestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const topics = await suggestStoryTopics(parsed.data.genre);
      res.json({ topics });
    } catch (error: any) {
      console.error("Topic suggestion error:", error);
      res.status(500).json({ message: error.message || "주제 추천에 실패했습니다" });
    }
  });

  app.post("/api/bubble-projects", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const canUseBubble = await storage.deductBubbleUse(userId);
      if (!canUseBubble) {
        return res.status(403).json({ message: "이번 달의 말풍선 편집기 무료 사용 횟수(3회)를 모두 사용했습니다." });
      }
      const { name, thumbnailUrl, canvasData, editorType } = req.body;
      if (!name || !canvasData) {
        return res.status(400).json({ message: "이름과 캔버스 데이터가 필요합니다." });
      }
      const project = await storage.createBubbleProject({
        userId,
        name,
        thumbnailUrl: thumbnailUrl || null,
        canvasData,
        editorType: editorType || "bubble",
      });
      res.json(project);
    } catch (error: any) {
      console.error("Create bubble project error:", error);
      res.status(500).json({ message: error.message || "프로젝트 저장에 실패했습니다." });
    }
  });

  app.get("/api/bubble-projects", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const projects = await storage.getBubbleProjectsByUser(userId);
      res.json(projects);
    } catch (error: any) {
      console.error("List bubble projects error:", error);
      res.status(500).json({ message: error.message || "프로젝트 목록 조회에 실패했습니다." });
    }
  });

  app.get("/api/bubble-projects/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ message: "잘못된 프로젝트 ID입니다." });
      const project = await storage.getBubbleProject(id, userId);
      if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      res.json(project);
    } catch (error: any) {
      console.error("Get bubble project error:", error);
      res.status(500).json({ message: error.message || "프로젝트 조회에 실패했습니다." });
    }
  });

  app.patch("/api/bubble-projects/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ message: "잘못된 프로젝트 ID입니다." });
      const parsed = updateBubbleProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "잘못된 입력입니다." });
      }
      const updated = await storage.updateBubbleProject(id, userId, parsed.data);
      if (!updated) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      res.json(updated);
    } catch (error: any) {
      console.error("Update bubble project error:", error);
      res.status(500).json({ message: error.message || "프로젝트 업데이트에 실패했습니다." });
    }
  });

  app.delete("/api/bubble-projects/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ message: "잘못된 프로젝트 ID입니다." });
      const deleted = await storage.deleteBubbleProject(id, userId);
      if (!deleted) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete bubble project error:", error);
      res.status(500).json({ message: error.message || "프로젝트 삭제에 실패했습니다." });
    }
  });

  return httpServer;
}
