import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, ArrowRight, Loader2, Palette, Sparkles, MessageCircle, Bot, Lock, UploadCloud, X, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FlowStepper } from "@/components/flow-stepper";
import { setFlowState } from "@/lib/flow";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FREE_STYLES = ["simple-line", "minimal", "doodle"];

const styles = [
  { value: "simple-line", label: "심플 라인", description: "깔끔한 두꺼운 선, 미니멀 디테일" },
  { value: "minimal", label: "미니멀", description: "극도로 간결한, 점 눈, 기하학적" },
  { value: "cute-animal", label: "귀여운 동물", description: "동글동글 동물 캐릭터, 파스텔 컬러" },
  { value: "doodle", label: "낙서풍", description: "거칠고 자유로운 펜 낙서, 날것의 매력" },
  { value: "scribble", label: "구불구불 손글씨", description: "볼펜으로 끄적끄적, 삐뚤삐뚤 스크리블" },
  { value: "ink-sketch", label: "잉크 스케치", description: "붓펜의 강약 조절, 대담한 먹선" },
];

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("simple-line");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: usage, isLoading: usageLoading } = useQuery<{ tier: string; credits: number }>({ queryKey: ["/api/usage"] });
  const isPro = usage?.tier === "pro";
  // BUG FIX 2: If usage is still loading, credits are UNKNOWN — do NOT show "완료" yet.
  // Previously: (undefined ?? 0) = 0 → button disabled + "오늘 무료 생성 완료" flash on every load.
  const isOutOfCredits = !usageLoading && !isPro && typeof usage?.credits === "number" && usage.credits <= 0;
  const [showStyleDialog, setShowStyleDialog] = useState(false);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const qp = sp.get("prompt");
      if (qp) setPrompt(qp);
    } catch {}
  }, []);

  const aiPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", { type: "character" });
      return res.json();
    },
    onSuccess: (data) => {
      setPrompt(data.prompt);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "로그인이 필요합니다", description: "로그인 후 다시 시도해주세요.", variant: "destructive" });
        setTimeout(() => navigate("/login"), 300);
        return;
      }
      toast({ title: "AI 프롬프트 생성 실패", description: error.message || "잠시 후 다시 시도해주세요.", variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate-character", { prompt, style, format: "png", transparent: true });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setCharacterId(data.characterId);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: "캐릭터 완성!", description: "캐릭터가 성공적으로 생성되었습니다." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        // BUG FIX 3: window.location.href during React render cycle causes black screen.
        // Use wouter navigate() instead — it updates the React router without hard reload.
        toast({ title: "로그인이 필요합니다", description: "로그인 후 다시 시도해주세요.", variant: "destructive" });
        setTimeout(() => navigate("/login"), 300);
        return;
      }
      if (/^403/.test(error.message)) {
        toast({ title: "크레딧 부족", description: "오늘의 무료 생성을 모두 사용했습니다.", variant: "destructive" });
        return;
      }
      toast({ title: "생성 실패", description: error.message || "잠시 후 다시 시도해주세요.", variant: "destructive" });
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <FlowStepper currentStep={1} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-create-title">캐릭터 만들기</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">캐릭터를 설명하면 귀엽고 간단한 인스타툰 스타일로 그려드려요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Wand2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <h2 className="text-base font-semibold">캐릭터 설명</h2>
            </div>
            <Textarea
              placeholder="예: 안경 쓴 동글동글한 고양이, 작은 모자를 쓴 곰돌이, 큰 동그란 안경을 쓴 짧은 머리 소녀..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none text-base"
              data-testid="input-prompt"
            />
            <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">간단한 설명일수록 더 좋은 결과를 얻을 수 있어요!</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => aiPromptMutation.mutate()}
                disabled={aiPromptMutation.isPending}
                data-testid="button-ai-prompt-character"
              >
                {aiPromptMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                )}
                AI 캐릭터
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-4.5 w-4.5 text-primary" />
              </div>
              <h2 className="text-base font-semibold">그림 스타일</h2>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStyleDialog(true)}
                data-testid="button-open-style-dialog"
              >
                그림 스타일 선택
              </Button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-muted text-[11px]">
                  {styles.find((s) => s.value === style)?.label || "심플 라인"}
                </span>
                <span>스타일 적용 중</span>
              </div>
            </div>
          </Card>

          <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">그림 스타일 선택</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styles.map((s) => {
                  const isFreeStyle = FREE_STYLES.includes(s.value);
                  const isLocked = !isPro && !isFreeStyle;
                  const selected = style === s.value;
                  return (
                    <button
                      key={s.value}
                      className={`text-left rounded-md border p-3 transition-colors ${isLocked ? "opacity-50 cursor-not-allowed" : "hover-elevate"} ${selected ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => {
                        if (isLocked) return;
                        setStyle(s.value);
                        setShowStyleDialog(false);
                      }}
                      data-testid={`button-style-${s.value}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{s.label}</span>
                        {isLocked && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            Pro
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.description}</div>
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => generateMutation.mutate()}
            disabled={!prompt.trim() || generateMutation.isPending || isOutOfCredits || usageLoading}
            data-testid="button-generate"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                그리는 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                캐릭터 생성하기
              </>
            )}
          </Button>
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
          <Card className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px]">
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="w-full aspect-square rounded-lg" />
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">캐릭터를 그리고 있어요...</p>
                  <p className="text-xs text-muted-foreground">15~30초 정도 걸려요</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="w-full overflow-hidden rounded-lg border">
                  <img
                    src={generatedImage}
                    alt="Generated character"
                    className="w-full object-contain"
                    data-testid="img-generated-character"
                  />
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      if (characterId) {
                        setFlowState({ selectedCharacterIds: [characterId] });
                      }
                      navigate(`/pose?characterId=${characterId}&flow=1`);
                    }}
                    data-testid="button-create-poses"
                  >
                    포즈 만들기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => navigate(`/chat?characterId=${characterId}`)}
                    data-testid="button-create-chat"
                  >
                    <MessageCircle className="h-4 w-4" />
                    채팅 이미지
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Wand2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-base">여기에 캐릭터가 나타나요</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  왼쪽에서 설명을 입력하고 스타일을 선택한 후 생성 버튼을 눌러주세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">자동화 인스타툰 메뉴</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              만든 캐릭터나 이미지를 활용해 배경과 자막이 포함된 인스타툰 컷을 자동으로 만들 수 있어요.
            </p>
          </div>
          {/* <Button size="sm" variant="outline" onClick={() => navigate("/create-instatoon")}>
            인스타툰 자동 생성하기
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button> */}
        </Card>
      </div>
    </div>
  );
}
