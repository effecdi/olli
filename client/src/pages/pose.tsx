import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Sparkles, RotateCcw, Upload, X, Image as ImageIcon, ArrowLeft, ArrowRight, Bot } from "lucide-react";
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

export default function PosePage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const characterIdParam = params.get("characterId");
  const characterId = characterIdParam ? parseInt(characterIdParam) : null;
  const isFlow = params.get("flow") === "1";
  const [, navigate] = useLocation();

  const [posePrompt, setPosePrompt] = useState("");
  const [expressionPrompt, setExpressionPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery<{ creatorTier: number; totalGenerations: number; tier: string; credits: number }>({ queryKey: ["/api/usage"] });
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
      try {
        const parsed = JSON.parse(data.prompt);
        if (parsed.expression) setExpressionPrompt(parsed.expression);
        if (parsed.pose) setPosePrompt(parsed.pose);
      } catch {
        setPosePrompt(data.prompt);
      }
    },
    onError: (error: Error) => {
      toast({ title: "AI 프롬프트 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const pose = posePrompt.trim();
      const expr = expressionPrompt.trim();
      if (!pose && !expr) {
        throw new Error("표정 또는 포즈 설명을 입력해주세요.");
      }
      const finalPrompt = expr && pose ? `${expr}, ${pose}` : (pose || expr);
      const effectiveCharacterId = characterId ?? character?.id ?? null;
      if (!effectiveCharacterId) {
        throw new Error("캐릭터를 먼저 선택해주세요.");
      }
      const body: any = { prompt: finalPrompt, characterId: effectiveCharacterId };
      if (referenceImage) body.referenceImageData = referenceImage;
      const res = await apiRequest("POST", "/api/generate-pose", body);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setGenerationCount((c) => c + 1);
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

  const { data: characters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {isFlow && <FlowStepper currentStep={2} />}
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold tracking-tight">포즈 생성</h1>
        <p className="mt-2 text-muted-foreground">다양한 포즈와 표정을 만들어보세요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  표정 설명
                </Label>
                <Textarea
                  placeholder="예: 행복한 표정, 눈웃음, 살짝 열린 입..."
                  value={expressionPrompt}
                  onChange={(e) => setExpressionPrompt(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="input-expression-prompt"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  포즈 설명
                </Label>
                <Textarea
                  placeholder="예: 두 손을 들고 점프하는 포즈..."
                  value={posePrompt}
                  onChange={(e) => setPosePrompt(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="input-pose-prompt"
                />
              </div>
              <div className="flex justify-end">
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
                  onClick={() => setPosePrompt(preset.prompt)}
                  data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </Card>

          <Card
            className="p-4 border-dashed space-y-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <h3 className="text-sm font-medium mb-3">레퍼런스 이미지</h3>
            <p className="mb-2 text-xs text-muted-foreground">캐릭터를 선택하고 이미지까지 준비한 뒤 포즈를 설명해주세요.</p>
            {referenceImage ? (
              <div className="relative">
                <img src={referenceImage} alt="Reference" className="w-full rounded-md object-contain max-h-40" />
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
              <>
                <label className="flex flex-col items-center gap-2 py-6 cursor-pointer text-muted-foreground rounded-md border border-dashed hover-elevate">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">이미지를 끌어오거나 클릭하여 업로드</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} data-testid="input-reference-upload" />
                </label>
                <div className="border-t border-dashed pt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">내 캐릭터에서 선택</span>
                    {characters && characters.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {characters.length}개
                      </span>
                    )}
                  </div>
                  {characters && characters.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5 max-h-[120px] overflow-y-auto">
                      {characters.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="aspect-square rounded-md overflow-hidden border border-border hover-elevate"
                          onClick={() => setReferenceImage(c.imageUrl || "")}
                          data-testid={`button-pose-character-${c.id}`}
                        >
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt={c.prompt || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                              캐릭터
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      생성된 캐릭터가 없습니다. 먼저 캐릭터를 만들어주세요.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => generateMutation.mutate()}
            disabled={
              !(posePrompt.trim() || expressionPrompt.trim()) ||
              !referenceImage ||
              generateMutation.isPending ||
              isOutOfCredits ||
              generationCount >= 3
            }
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
                    onClick={() => { setGeneratedImage(null); setPosePrompt(""); setExpressionPrompt(""); }}
                    data-testid="button-generate-another"
                  >
                    <RotateCcw className="h-4 w-4" />
                    새 포즈
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">생성된 포즈가 여기에 표시됩니다</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  캐릭터와 레퍼런스를 선택하고 포즈를 설명한 뒤 생성하세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      {isFlow && (
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/create")} data-testid="button-flow-prev">
            <ArrowLeft className="h-4 w-4" /> 캐릭터 준비
          </Button>
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => { setFlowState({ lastPoseImageUrl: generatedImage || "" }); navigate("/background?flow=1"); }} data-testid="button-flow-next">
            배경/아이템 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
