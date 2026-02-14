import { useState, useCallback, useEffect } from "react";
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
import { Loader2, Download, RotateCcw, Upload, X, Trees, Package, ArrowLeft, ArrowRight, Bot } from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { setFlowState, getFlowState } from "@/lib/flow";
import type { Generation } from "@shared/schema";

const bgPresets = [
  { label: "Cafe", bg: "cozy cafe interior, warm lighting, coffee cups", items: "coffee cup, pastry on table" },
  { label: "Park", bg: "sunny park with green trees, blue sky", items: "bench, flowers, butterfly" },
  { label: "Beach", bg: "sandy beach with ocean waves, sunset sky", items: "beach umbrella, surfboard" },
  { label: "Room", bg: "cozy bedroom with bed and window, night time", items: "pillow, lamp, books" },
  { label: "School", bg: "classroom with desks and blackboard", items: "backpack, notebook, pencil" },
  { label: "Rain", bg: "rainy street, puddles on ground, cloudy sky", items: "umbrella, raindrops" },
  { label: "Snow", bg: "snowy winter scene, snowflakes falling", items: "scarf, hot cocoa, snowman" },
  { label: "Space", bg: "outer space with stars and planets", items: "rocket, moon, stars" },
];

export default function BackgroundPage() {
  const search = useSearch();
  const bgParams = new URLSearchParams(search);
  const isFlow = bgParams.get("flow") === "1";
  const [, navigate] = useLocation();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [itemsPrompt, setItemsPrompt] = useState("");
  const [bgResultImage, setBgResultImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery<{creatorTier: number; totalGenerations: number; tier: string; credits: number}>({ queryKey: ["/api/usage"] });
  const isPro = usageData?.tier === "pro";
  const isOutOfCredits = !isPro && (usageData?.credits ?? 0) <= 0;

  useEffect(() => {
    if (isFlow && !sourceImage) {
      const flow = getFlowState();
      if (flow.lastPoseImageUrl) {
        setSourceImage(flow.lastPoseImageUrl);
      }
    }
  }, []);

  const { data: galleryItems, isLoading: galleryLoading } = useQuery<Generation[]>({
    queryKey: ["/api/gallery"],
    select: (data: any[]) => data.filter((g) => g.type === "character" && g.resultImageUrl),
  });

  const aiPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", { type: "background" });
      return res.json();
    },
    onSuccess: (data) => {
      try {
        const parsed = JSON.parse(data.prompt);
        if (parsed.background) setBgPrompt(parsed.background);
        if (parsed.items) setItemsPrompt(parsed.items);
      } catch {
        setBgPrompt(data.prompt);
      }
    },
    onError: (error: Error) => {
      toast({ title: "AI 프롬프트 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const bgMutation = useMutation({
    mutationFn: async () => {
      if (!sourceImage) throw new Error("No source image selected");
      const res = await apiRequest("POST", "/api/generate-background", {
        sourceImageData: sourceImage,
        backgroundPrompt: bgPrompt,
        itemsPrompt: itemsPrompt || undefined,
        characterId: selectedCharacterId || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setBgResultImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "배경 생성 완료!", description: "캐릭터에 배경과 아이템이 추가되었어요." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "로그인 필요", description: "다시 로그인 해주세요.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "파일이 너무 커요", description: "10MB 이하 이미지를 선택해주세요.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setSelectedCharacterId(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setSelectedCharacterId(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const selectFromGallery = (item: Generation) => {
    setSourceImage(item.resultImageUrl);
    setSelectedCharacterId(item.characterId);
  };

  const applyBgPreset = (preset: typeof bgPresets[0]) => {
    setBgPrompt(preset.bg);
    setItemsPrompt(preset.items);
  };

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `background-${Date.now()}.png`;
    a.click();
  };

  const resetAll = () => {
    setBgResultImage(null);
    setBgPrompt("");
    setItemsPrompt("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {isFlow && <FlowStepper currentStep={3} />}
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold tracking-tight">배경 / 아이템</h1>
        <p className="mt-2 text-muted-foreground">캐릭터에 배경과 소품을 추가해보세요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">원본 이미지 선택</h3>

            {sourceImage ? (
              <div className="relative">
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full object-contain max-h-[300px]"
                    data-testid="img-source-preview"
                  />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => { setSourceImage(null); setSelectedCharacterId(null); }}
                  data-testid="button-clear-source"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 cursor-pointer hover-elevate"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("bg-file-input")?.click()}
                data-testid="dropzone-source-image"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  이미지를 드래그하거나 클릭해서 업로드
                </p>
                <input
                  id="bg-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-file-source"
                />
              </div>
            )}
          </Card>

          {galleryItems && galleryItems.length > 0 && !sourceImage && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">또는 내 캐릭터에서 선택</h3>
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {galleryLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                  ))
                ) : (
                  galleryItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectFromGallery(item)}
                      className="overflow-hidden rounded-md border hover-elevate active-elevate-2"
                      data-testid={`button-select-char-${item.id}`}
                    >
                      <img
                        src={item.resultImageUrl!}
                        alt={item.prompt}
                        className="w-full aspect-square object-cover"
                      />
                    </button>
                  ))
                )}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">장면 프리셋</h3>
            <div className="flex flex-wrap gap-2">
              {bgPresets.map((preset) => (
                <Badge
                  key={preset.label}
                  variant="outline"
                  className="cursor-pointer"
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
                  placeholder="예: 따뜻한 조명의 아늑한 카페 안..."
                  value={bgPrompt}
                  onChange={(e) => setBgPrompt(e.target.value)}
                  className="min-h-[70px] resize-none"
                  data-testid="input-bg-prompt"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  아이템 (선택사항)
                </Label>
                <Input
                  placeholder="예: 커피잔, 꽃다발, 우산..."
                  value={itemsPrompt}
                  onChange={(e) => setItemsPrompt(e.target.value)}
                  data-testid="input-items-prompt"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => aiPromptMutation.mutate()}
                  disabled={aiPromptMutation.isPending}
                  data-testid="button-ai-prompt-background"
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
                배경 생성하기
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

        <div>
          <Card className="p-4 flex flex-col items-center justify-center min-h-[500px]">
            {bgMutation.isPending ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="w-full aspect-[3/4] rounded-md" />
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">배경과 아이템을 추가하는 중...</p>
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
                    onClick={() => downloadImage(bgResultImage)}
                    data-testid="button-download-bg"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={resetAll}
                    data-testid="button-new-bg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    다시 만들기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Trees className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">결과가 여기에 표시돼요</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  이미지를 선택하고 배경을 설명한 후 생성 버튼을 눌러주세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      {isFlow && (
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/pose?characterId=${getFlowState().selectedCharacterIds[0] || ""}&flow=1`)} data-testid="button-flow-prev">
            <ArrowLeft className="h-4 w-4" /> 포즈/표정
          </Button>
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => { if (bgResultImage) setFlowState({ lastPoseImageUrl: bgResultImage }); navigate("/effects?flow=1"); }} data-testid="button-flow-next">
            효과 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
