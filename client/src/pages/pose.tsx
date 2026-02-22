import { useState, useCallback, useEffect } from "react";
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
import { Loader2, Download, RotateCcw, Upload, X, ArrowLeft, ArrowRight, Bot, Sparkles } from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { setFlowState } from "@/lib/flow";
import type { Generation } from "@shared/schema";

const posePresets = [
  { label: "서 있기", prompt: "편하게 서 있는 포즈, 정면, 자연스러운 표정" },
  { label: "행복", prompt: "두 손을 들고 기뻐하는 포즈, 큰 미소, 눈웃음" },
  { label: "앉아 있기", prompt: "편하게 앉아 있는 포즈, 다리를 모으고 살짝 기대기" },
  { label: "피곤", prompt: "어깨가 처진 포즈, 졸린 눈, 하품하는 표정" },
  { label: "먹기", prompt: "간식을 들고 한 입 베어무는 포즈, 행복한 표정" },
  { label: "놀람", prompt: "두 손을 벌린 놀란 포즈, 동그란 눈과 입" },
  { label: "잠자기", prompt: "웅크리고 자는 포즈, 편안한 표정, zzz" },
  { label: "화남", prompt: "팔짱을 낀 채 화난 포즈, 볼이 붉어진 표정" },
];

export default function PosePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isFlow = params.get("flow") === "1";
  const [, navigate] = useLocation();

  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [posePrompt, setPosePrompt] = useState("");
  const [poseResultImage, setPoseResultImage] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery<{ creatorTier: number; totalGenerations: number; tier: string; credits: number }>({
    queryKey: ["/api/usage"],
  });
  const isPro = usageData?.tier === "pro";
  const isOutOfCredits = !isPro && (usageData?.credits ?? 0) <= 0;

  const { data: galleryItems, isLoading: galleryLoading } = useQuery<Generation[]>({
    queryKey: ["/api/gallery"],
    select: (data: any[]) => data.filter((g) => g.type === "character" && g.resultImageUrl),
  });

  const selectedGeneration = galleryItems?.find((g) => g.characterId === selectedCharacterId) || null;

  const aiPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", {
        type: "pose",
        context: selectedGeneration?.prompt || "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPosePrompt(data.prompt);
    },
    onError: (error: Error) => {
      toast({ title: "AI 프롬프트 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCharacterId) {
        throw new Error("캐릭터를 먼저 선택해주세요.");
      }
      const pose = posePrompt.trim();
      if (!pose) {
        throw new Error("표정 또는 포즈 설명을 입력해주세요.");
      }
      const res = await apiRequest("POST", "/api/generate-pose", {
        characterId: selectedCharacterId,
        prompt: pose,
        referenceImageData: referenceImage || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPoseResultImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      if (isFlow) setFlowState({ lastPoseImageUrl: data.imageUrl });
      toast({ title: "포즈 생성 완료!", description: "캐릭터 포즈가 완성되었어요." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "로그인 필요", description: "다시 로그인 해주세요.", variant: "destructive" });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({ title: "생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const handleReferenceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "파일이 너무 커요", description: "10MB 이하 이미지를 선택해주세요.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleReferenceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const applyPosePreset = (preset: typeof posePresets[0]) => {
    setPosePrompt(preset.prompt);
  };

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `pose-${Date.now()}.png`;
    a.click();
  };

  const canGenerate =
    !!selectedCharacterId &&
    !!posePrompt.trim() &&
    !generateMutation.isPending &&
    !isOutOfCredits;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {isFlow && <FlowStepper currentStep={2} />}
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold tracking-tight">포즈 / 표정</h1>
        <p className="mt-2 text-muted-foreground">생성된 캐릭터에 다양한 포즈와 표정을 더해보세요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">기준 캐릭터 선택</h3>

            {selectedGeneration ? (
              <div className="relative">
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={selectedGeneration.resultImageUrl!}
                    alt={selectedGeneration.prompt}
                    className="w-full object-contain max-h-[300px]"
                  />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedCharacterId(null)}
                  data-testid="button-clear-selected-character"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                {galleryLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-md" />
                    ))}
                  </div>
                ) : galleryItems && galleryItems.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto">
                    {galleryItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedCharacterId(item.characterId)}
                        className="overflow-hidden rounded-md border hover-elevate active-elevate-2"
                        data-testid={`button-select-pose-char-${item.id}`}
                      >
                        <img
                          src={item.resultImageUrl!}
                          alt={item.prompt}
                          className="w-full aspect-square object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    생성된 캐릭터가 없습니다. 먼저 캐릭터를 만들어주세요.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">참고 포즈 이미지 (선택)</h3>
            {referenceImage ? (
              <div className="relative">
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full object-contain max-h-[300px]"
                    data-testid="img-reference-preview"
                  />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setReferenceImage(null)}
                  data-testid="button-clear-reference"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 cursor-pointer hover-elevate"
                onDrop={handleReferenceDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("pose-ref-file-input")?.click()}
                data-testid="dropzone-reference-image"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  포즈 참고 이미지를 드래그하거나 클릭해서 업로드
                </p>
                <input
                  id="pose-ref-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReferenceUpload}
                  data-testid="input-file-reference"
                />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">빠른 포즈 프리셋</h3>
            <div className="flex flex-wrap gap-2">
              {posePresets.map((preset) => (
                <Badge
                  key={preset.label}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => applyPosePreset(preset)}
                  data-testid={`pose-preset-${preset.label.toLowerCase()}`}
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
                  <Sparkles className="h-3.5 w-3.5" />
                  포즈/표정 설명
                </Label>
                <Textarea
                  placeholder="예: 눈웃음으로 한 손을 들어 인사하는 포즈..."
                  value={posePrompt}
                  onChange={(e) => setPosePrompt(e.target.value)}
                  className="min-h-[70px] resize-none"
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

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => generateMutation.mutate()}
            disabled={!canGenerate}
            data-testid="button-generate-pose"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                포즈 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                포즈 생성하기
              </>
            )}
          </Button>
          {!isPro && isOutOfCredits && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">오늘의 무료 생성 횟수를 모두 사용했습니다.</p>
              <Button size="sm" variant="secondary" asChild>
                <a href="/pricing">Pro 업그레이드</a>
              </Button>
            </div>
          )}
        </div>

        <div>
          <Card className="p-4 flex flex-col items-center justify-center min-h-[500px]">
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="w-full aspect-[3/4] rounded-md" />
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">포즈와 표정을 생성하는 중...</p>
                </div>
              </div>
            ) : poseResultImage ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={poseResultImage}
                    alt="Pose result"
                    className="w-full object-contain"
                    data-testid="img-pose-result"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => downloadImage(poseResultImage)}
                    data-testid="button-download-pose"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setPoseResultImage(null);
                      setPosePrompt("");
                    }}
                    data-testid="button-new-pose"
                  >
                    <RotateCcw className="h-4 w-4" />
                    새 포즈 만들기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">결과가 여기에 표시돼요</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  기준 캐릭터를 선택하고 포즈와 표정을 설명한 후 생성 버튼을 눌러주세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {isFlow && (
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/create")}
            data-testid="button-flow-prev"
          >
            <ArrowLeft className="h-4 w-4" /> 캐릭터 준비
          </Button>
          <div className="flex-1" />
          <Button
            className="gap-2"
            onClick={() => {
              setFlowState({ lastPoseImageUrl: poseResultImage || "" });
              navigate("/background?flow=1");
            }}
            data-testid="button-flow-next"
          >
            배경/아이템 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
