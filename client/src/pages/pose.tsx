import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Sparkles, RotateCcw, Upload, X, Image as ImageIcon, Trees, Package, ArrowLeft, ArrowRight, Bot } from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { setFlowState } from "@/lib/flow";
import type { Character } from "@shared/schema";

const posePresets = [
  { label: "서 있기", prompt: "standing pose, facing front, simple and cute" },
  { label: "행복", prompt: "very happy expression, arms up in joy, big smile" },
  { label: "앉아 있기", prompt: "sitting down, relaxed, cozy feeling" },
  { label: "피곤", prompt: "tired, droopy eyes, slumped over, exhausted" },
  { label: "먹기", prompt: "eating food, holding something and munching" },
  { label: "놀람", prompt: "shocked expression, mouth open wide, startled" },
  { label: "잠자기", prompt: "sleeping peacefully, curled up, zzz" },
  { label: "화남", prompt: "angry, puffed cheeks, annoyed expression" },
];

const bgPresets = [
  { label: "카페", bg: "cozy cafe interior, warm lighting, coffee cups", items: "coffee cup, pastry on table" },
  { label: "공원", bg: "sunny park with green trees, blue sky", items: "bench, flowers, butterfly" },
  { label: "해변", bg: "sandy beach with ocean waves, sunset sky", items: "beach umbrella, surfboard" },
  { label: "방", bg: "cozy bedroom with bed and window, night time", items: "pillow, lamp, books" },
  { label: "학교", bg: "classroom with desks and blackboard", items: "backpack, notebook, pencil" },
  { label: "비", bg: "rainy street, puddles on ground, cloudy sky", items: "umbrella, raindrops" },
  { label: "눈", bg: "snowy winter scene, snowflakes falling", items: "scarf, hot cocoa, snowman" },
  { label: "우주", bg: "outer space with stars and planets", items: "rocket, moon, stars" },
];

export default function PosePage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const characterIdParam = params.get("characterId");
  const characterId = characterIdParam ? parseInt(characterIdParam) : null;
  const isFlow = params.get("flow") === "1";
  const [, navigate] = useLocation();

  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [bgPrompt, setBgPrompt] = useState("");
  const [itemsPrompt, setItemsPrompt] = useState("");
  const [bgResultImage, setBgResultImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery<{creatorTier: number; totalGenerations: number; tier: string; credits: number}>({ queryKey: ["/api/usage"] });
  const isPro = usageData?.tier === "pro";
  const isOutOfCredits = !isPro && (usageData?.credits ?? 0) <= 0;

  const { data: character, isLoading: characterLoading } = useQuery<Character>({
    queryKey: ["/api/characters", characterId],
    enabled: !!characterId,
  });

  const aiPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", { type: "pose", context: character?.prompt || "" });
      return res.json();
    },
    onSuccess: (data) => {
      setPrompt(data.prompt);
    },
    onError: (error: Error) => {
      toast({ title: "AI 프롬프트 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const body: any = { prompt };
      if (characterId) body.characterId = characterId;
      if (referenceImage) body.referenceImageData = referenceImage;
      const res = await apiRequest("POST", "/api/generate-pose", body);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setGenerationCount((c) => c + 1);
      setShowBgPanel(false);
      setBgResultImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      if (isFlow) setFlowState({ lastPoseImageUrl: data.imageUrl });
      toast({ title: "포즈 완성!", description: "캐릭터 포즈가 성공적으로 생성되었습니다." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "인증 오류", description: "다시 로그인합니다...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const bgMutation = useMutation({
    mutationFn: async () => {
      const sourceImage = generatedImage || character?.imageUrl;
      if (!sourceImage) throw new Error("No source image");
      const res = await apiRequest("POST", "/api/generate-background", {
        sourceImageData: sourceImage,
        backgroundPrompt: bgPrompt,
        itemsPrompt: itemsPrompt || undefined,
        characterId: characterId || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setBgResultImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: "배경 추가 완료!", description: "캐릭터에 배경과 아이템이 추가되었습니다." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "인증 오류", description: "다시 로그인합니다...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const downloadImage = (url: string, prefix: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}-${Date.now()}.png`;
    a.click();
  };

  const applyBgPreset = (preset: typeof bgPresets[0]) => {
    setBgPrompt(preset.bg);
    setItemsPrompt(preset.items);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {isFlow && <FlowStepper currentStep={2} />}
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold tracking-tight">포즈 생성</h1>
        <p className="mt-2 text-muted-foreground">다양한 포즈와 표정을 만들어보세요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">참조 캐릭터</h3>
            {characterLoading ? (
              <Skeleton className="w-full aspect-[3/4] rounded-md" />
            ) : character ? (
              <div className="overflow-hidden rounded-md border">
                <img
                  src={character.imageUrl}
                  alt="Reference character"
                  className="w-full object-contain"
                  data-testid="img-reference-character"
                />
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground truncate">
              {character?.prompt}
            </p>
            <Badge variant="secondary" className="mt-2 capitalize">{character?.style}</Badge>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">포즈 설명</h3>
            <Textarea
              placeholder="예: 점프하는 포즈, 행복한 표정..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="input-pose-prompt"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => aiPromptMutation.mutate()}
                disabled={aiPromptMutation.isPending}
                data-testid="button-ai-prompt-pose"
              >
                {aiPromptMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                )}
                AI 프롬프트
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">빠른 프리셋</h3>
            <div className="flex flex-wrap gap-2">
              {posePresets.map((preset) => (
                <Badge
                  key={preset.label}
                  variant="outline"
                  className="cursor-pointer hover-elevate"
                  onClick={() => setPrompt(preset.prompt)}
                  data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </Card>

          <Card
            className="p-4 border-dashed"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <h3 className="text-sm font-medium mb-3">캐릭터 업로드</h3>
            {referenceImage ? (
              <div className="relative">
                <img src={referenceImage} alt="Uploaded character" className="w-full rounded-md object-contain max-h-40" />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setReferenceImage(null)}
                  data-testid="button-remove-reference"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 py-6 cursor-pointer text-muted-foreground rounded-md border border-dashed hover-elevate">
                <Upload className="h-6 w-6" />
                <span className="text-sm">캐릭터 이미지를 끌어오거나 클릭하여 업로드</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} data-testid="input-reference-upload" />
              </label>
            )}
          </Card>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => generateMutation.mutate()}
            disabled={!prompt.trim() || generateMutation.isPending || isOutOfCredits || generationCount >= 3}
            data-testid="button-generate-pose"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                포즈 생성
              </>
            )}
          </Button>
          {generationCount >= 3 && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">포즈 화면에서 생성은 3회로 제한됐어요.</p>
              <Button size="sm" variant="secondary" asChild>
                <a href="/pricing">Pro 업그레이드</a>
              </Button>
            </div>
          )}
          {!isPro && isOutOfCredits && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">오늘의 무료 생성 3회를 모두 사용했습니다.</p>
              <Button size="sm" variant="secondary" asChild>
                <a href="/pricing">Pro 업그레이드</a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex-1 p-4 flex flex-col items-center justify-center min-h-[400px]">
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="w-full aspect-[3/4] rounded-md" />
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">포즈 생성 중...</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={generatedImage}
                    alt="Generated pose"
                    className="w-full object-contain"
                    data-testid="img-generated-pose"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => downloadImage(generatedImage, "pose")}
                    data-testid="button-download-pose"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={() => { setGeneratedImage(null); setPrompt(""); setShowBgPanel(false); setBgResultImage(null); }}
                    data-testid="button-generate-another"
                  >
                    <RotateCcw className="h-4 w-4" />
                    새 포즈
                  </Button>
                </div>
                {!showBgPanel && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowBgPanel(true)}
                    data-testid="button-open-bg-panel"
                  >
                    <Trees className="h-4 w-4" />
                    배경/아이템 추가
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">생성된 포즈가 여기에 표시됩니다</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  포즈를 설명하거나 프리셋을 선택한 후 생성하세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showBgPanel && generatedImage && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="font-sans text-2xl font-bold tracking-tight">배경 & 아이템 추가</h2>
            <p className="mt-1 text-muted-foreground">캐릭터에 배경과 소품을 추가해보세요</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">장면 프리셋</h3>
                <div className="flex flex-wrap gap-2">
                  {bgPresets.map((preset) => (
                    <Badge
                      key={preset.label}
                      variant="outline"
                      className="cursor-pointer hover-elevate"
                      onClick={() => applyBgPreset(preset)}
                      data-testid={`bg-preset-${preset.label.toLowerCase()}`}
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Trees className="h-3.5 w-3.5" />
                      배경 설명
                    </Label>
                    <Textarea
                      placeholder="예: 따뜻한 조명의 아늑한 카페 인테리어..."
                      value={bgPrompt}
                      onChange={(e) => setBgPrompt(e.target.value)}
                      className="min-h-[70px] resize-none"
                      data-testid="input-bg-prompt"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      아이템 (선택)
                    </Label>
                    <Input
                      placeholder="예: 커피잔, 꽃, 우산..."
                      value={itemsPrompt}
                      onChange={(e) => setItemsPrompt(e.target.value)}
                      data-testid="input-items-prompt"
                    />
                  </div>
                </div>
              </Card>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => bgMutation.mutate()}
                disabled={!bgPrompt.trim() || bgMutation.isPending || isOutOfCredits}
                data-testid="button-generate-bg"
              >
                {bgMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    배경 생성 중...
                  </>
                ) : (
                  <>
                    <Trees className="h-4 w-4" />
                    배경 합성 생성
                  </>
                )}
              </Button>
            </div>

            <div>
              <Card className="p-4 flex flex-col items-center justify-center min-h-[400px]">
                {bgMutation.isPending ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <Skeleton className="w-full aspect-[3/4] rounded-md" />
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">배경 & 아이템 추가 중...</p>
                    </div>
                  </div>
                ) : bgResultImage ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="overflow-hidden rounded-md border">
                      <img
                        src={bgResultImage}
                        alt="Character with background"
                        className="w-full object-contain"
                        data-testid="img-bg-result"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => downloadImage(bgResultImage, "background")}
                        data-testid="button-download-bg"
                      >
                        <Download className="h-4 w-4" />
                        다운로드
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 gap-2"
                        onClick={() => { setBgResultImage(null); setBgPrompt(""); setItemsPrompt(""); }}
                        data-testid="button-new-bg"
                      >
                        <RotateCcw className="h-4 w-4" />
                        다시 시도
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Trees className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">배경 결과가 여기에 표시됩니다</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      배경 장면을 설명하거나 프리셋을 선택하세요
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
      {isFlow && (
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/create")} data-testid="button-flow-prev">
            <ArrowLeft className="h-4 w-4" /> 캐릭터 준비
          </Button>
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => { setFlowState({ lastPoseImageUrl: bgResultImage || generatedImage || "" }); navigate("/background?flow=1"); }} data-testid="button-flow-next">
            배경/아이템 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
