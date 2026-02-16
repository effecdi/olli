import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Download,
  MessageCircle,
  Type,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { BubbleCanvas } from "@/components/bubble-canvas";
import type { PageData, SpeechBubble, BubbleStyle } from "@/lib/bubble-types";
import { generateId, getDefaultTailTip, KOREAN_FONTS, STYLE_LABELS } from "@/lib/bubble-utils";
import type { Generation } from "@shared/schema";

type InstatoonPanelTab = "image" | "prompt" | "captions" | "bubbles";

export default function CreateInstatoonPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);
  const [instatoonImage, setInstatoonImage] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState("");
  const [topCaptions, setTopCaptions] = useState<string[]>([""]);
  const [bottomCaptions, setBottomCaptions] = useState<string[]>([""]);
  const [bubblePage, setBubblePage] = useState<PageData>({
    id: generateId(),
    bubbles: [],
    characters: [],
    canvasSize: { width: 522, height: 695 },
  });
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [zoom] = useState(100);
  const [activeTab, setActiveTab] = useState<InstatoonPanelTab>("image");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { data: usage } = useQuery<{ tier: string; credits: number; creatorTier: number; totalGenerations: number; creditsUsed?: number }>({
    queryKey: ["/api/usage"],
  });
  const isPro = usage?.tier === "pro";
  const isOutOfCredits = !isPro && (usage?.credits ?? 0) <= 0;
  const canAllFontsInstatoon = isPro || (usage?.creatorTier ?? 0) >= 3;
  const availableFonts = canAllFontsInstatoon ? KOREAN_FONTS : KOREAN_FONTS.slice(0, 3);

  const { data: galleryItems, isLoading: galleryLoading } = useQuery<Generation[]>({
    queryKey: ["/api/gallery"],
    select: (data: any[]) => data.filter((g) => g.resultImageUrl),
  });

  const selectedGeneration = galleryItems?.find((g) => g.id === selectedGenerationId) || null;

  useEffect(() => {
    if (selectedGeneration && selectedGeneration.resultImageUrl) {
      setSourceImage(selectedGeneration.resultImageUrl);
      setInstatoonImage(null);
    }
  }, [selectedGeneration]);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "파일이 너무 커요", description: "10MB 이하 이미지를 선택해주세요.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result as string);
        setSelectedGenerationId(null);
        setInstatoonImage(null);
      };
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setSelectedGenerationId(null);
      setInstatoonImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const aiPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", { type: "background" });
      return res.json();
    },
    onSuccess: (data) => {
      try {
        const parsed = JSON.parse(data.prompt);
        if (parsed.background && parsed.items) {
          setScenePrompt(`${parsed.background} / ${parsed.items}`);
        } else if (parsed.background) {
          setScenePrompt(parsed.background);
        } else {
          setScenePrompt(data.prompt);
        }
      } catch {
        setScenePrompt(data.prompt);
      }
    },
    onError: (error: Error) => {
      toast({ title: "AI 프롬프트 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!sourceImage) {
        throw new Error("먼저 이미지를 업로드하거나 갤러리에서 선택해주세요.");
      }
      if (!scenePrompt.trim()) {
        throw new Error("인스타툰 장면 프롬프트를 입력해주세요.");
      }
      const res = await apiRequest("POST", "/api/generate-background", {
        sourceImageData: sourceImage,
        backgroundPrompt: scenePrompt.trim(),
        itemsPrompt: undefined,
        characterId: selectedGeneration?.characterId || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setInstatoonImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: "인스타툰 생성 완료!", description: "장면이 완성되었습니다." });
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

  const baseImageForCanvas = instatoonImage || sourceImage;

  useEffect(() => {
    setBubblePage((prev) => ({
      ...prev,
      imageDataUrl: baseImageForCanvas || undefined,
      imageElement: undefined,
    }));
  }, [baseImageForCanvas]);

  const addSpeechBubble = () => {
    const canvasSize = bubblePage.canvasSize || { width: 522, height: 695 };
    const baseBubble: SpeechBubble = {
      id: generateId(),
      seed: Math.floor(Math.random() * 1_000_000),
      x: canvasSize.width * 0.2,
      y: canvasSize.height * 0.2,
      width: canvasSize.width * 0.6,
      height: 180,
      text: "",
      style: "handwritten",
      tailStyle: "long",
      tailDirection: "bottom",
      strokeWidth: 4,
      wobble: 1.5,
      fontSize: 28,
      fontKey: "default",
      zIndex: (bubblePage.bubbles[bubblePage.bubbles.length - 1]?.zIndex ?? 0) + 1,
    };
    const tip = getDefaultTailTip(baseBubble);
    const newBubble: SpeechBubble = {
      ...baseBubble,
      tailTipX: tip?.x,
      tailTipY: tip?.y,
    };
    setBubblePage((prev) => ({
      ...prev,
      bubbles: [...prev.bubbles, newBubble],
    }));
    setSelectedBubbleId(newBubble.id);
  };

  const updateSpeechBubble = (id: string, updates: Partial<SpeechBubble>) => {
    setBubblePage((prev) => ({
      ...prev,
      bubbles: prev.bubbles.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const srcCanvas = canvasRef.current;

    const hasTop = topCaptions.some((t) => t.trim().length > 0);
    const hasBottom = bottomCaptions.some((t) => t.trim().length > 0);

    if (!hasTop && !hasBottom) {
      const directUrl = srcCanvas.toDataURL("image/png");
      const directLink = document.createElement("a");
      directLink.href = directUrl;
      directLink.download = `instatoon-${Date.now()}.png`;
      directLink.click();
      return;
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = srcCanvas.width;
    outCanvas.height = srcCanvas.height;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(srcCanvas, 0, 0);

    ctx.textAlign = "center";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 40px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

    const topTexts = topCaptions.map((t) => t.trim()).filter((t) => t.length > 0);
    topTexts.forEach((text, index) => {
      const yPos = 80 + index * 56;
      wrapText(ctx, text, outCanvas.width / 2, yPos, outCanvas.width - 160, 44);
    });

    const bottomTexts = bottomCaptions.map((t) => t.trim()).filter((t) => t.length > 0);
    bottomTexts.forEach((text, index) => {
      const yPos = outCanvas.height - 80 - (bottomTexts.length - 1 - index) * 56;
      wrapText(ctx, text, outCanvas.width / 2, yPos, outCanvas.width - 160, 44);
    });

    const url = outCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `instatoon-${Date.now()}.png`;
    a.click();
  };

  const canGenerateInstatoon = !!sourceImage && !!scenePrompt.trim() && !generateMutation.isPending && !isOutOfCredits;
  const canDownload = !!baseImageForCanvas;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/create")}
        className="mb-4 inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
        캐릭터 만들기로 돌아가기
      </button>

      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold tracking-tight">자동화 인스타툰 생성</h1>
        <p className="mt-2 text-muted-foreground">
          업로드한 이미지나 생성된 캐릭터에 배경과 자막을 더해 한 컷 인스타툰을 자동으로 만들어보세요.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-[220px] flex-shrink-0">
          <div className="rounded-md border bg-card">
            <div className="px-3 py-2 border-b">
              <p className="text-[11px] font-semibold text-muted-foreground">패널</p>
            </div>
            <nav className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("image")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  activeTab === "image" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover-elevate"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  이미지 선택
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("prompt")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  activeTab === "prompt" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover-elevate"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  프롬프트
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("captions")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  activeTab === "captions" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover-elevate"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" />
                  자막 설정
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bubbles")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  activeTab === "bubbles" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover-elevate"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  말풍선
                </span>
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1 max-w-md space-y-4">
          {activeTab === "image" && (
            <>
              <Card className="p-3">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">베이스 이미지 선택</h3>
                {sourceImage ? (
                  <div className="relative">
                    <div className="overflow-hidden rounded-md border">
                      <img
                        src={sourceImage}
                        alt="Base"
                        className="w-full object-contain max-h-[320px]"
                        data-testid="img-instatoon-base"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSourceImage(null);
                        setSelectedGenerationId(null);
                        setInstatoonImage(null);
                      }}
                      data-testid="button-clear-instatoon-base"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-6 cursor-pointer hover-elevate"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById("instatoon-file-input")?.click()}
                    data-testid="dropzone-instatoon-base"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      인스타툰으로 만들 이미지를 드래그하거나 클릭해서 업로드
                    </p>
                    <input
                      id="instatoon-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      data-testid="input-file-instatoon-base"
                    />
                  </div>
                )}
              </Card>

              {galleryItems && galleryItems.length > 0 && !sourceImage && (
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">또는 생성한 캐릭터/장면에서 선택</h3>
                    <Badge variant="outline" className="text-[10px]">
                      My Gallery
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto">
                    {galleryLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="aspect-square rounded-md" />
                        ))
                      : galleryItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedGenerationId(item.id as number)}
                            className={`overflow-hidden rounded-md border hover-elevate active-elevate-2 ${
                              selectedGenerationId === item.id ? "ring-2 ring-primary" : ""
                            }`}
                            data-testid={`button-select-instatoon-${item.id}`}
                          >
                            <img
                              src={item.resultImageUrl!}
                              alt={item.prompt}
                              className="w-full aspect-square object-cover"
                            />
                          </button>
                        ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === "prompt" && (
            <Card className="p-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">인스타툰 프롬프트</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => aiPromptMutation.mutate()}
                    disabled={aiPromptMutation.isPending}
                    data-testid="button-ai-prompt-instatoon"
                  >
                    {aiPromptMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    AI 프롬프트
                  </Button>
                </div>
                <Textarea
                  placeholder="예: 비 오는 날 카페 창가에서 멍하니 밖을 보는 장면, 따뜻한 조명과 노란 우산들..."
                  value={scenePrompt}
                  onChange={(e) => setScenePrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  data-testid="input-instatoon-prompt"
                />
                <p className="text-[11px] text-muted-foreground">
                  장면 분위기, 장소, 시간대, 감정을 짧게 적어주세요. 배경과 소품이 자동으로 추가됩니다.
                </p>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => generateMutation.mutate()}
                  disabled={!canGenerateInstatoon}
                  data-testid="button-generate-instatoon"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      인스타툰 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      인스타툰 생성하기
                    </>
                  )}
                </Button>
                {!isPro && isOutOfCredits && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">오늘의 무료 생성 횟수를 모두 사용했습니다.</p>
                    <Button size="sm" variant="secondary" asChild>
                      <a href="/pricing">Pro 업그레이드</a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === "captions" && (
            <Card className="p-3">
              <h3 className="text-sm font-medium mb-3">자막 설정</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Type className="h-3.5 w-3.5" />
                      상단 자막
                    </Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setTopCaptions((prev) => [...prev, ""])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {topCaptions.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="예: 월요일 아침, 출근 10분 전..."
                          value={value}
                          onChange={(e) =>
                            setTopCaptions((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
                          }
                          data-testid={`input-caption-top-${index}`}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            setTopCaptions((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {topCaptions.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-1.5 text-xs"
                        onClick={() => setTopCaptions([""])}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        상단 자막 추가
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Type className="h-3.5 w-3.5" />
                      하단 자막
                    </Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setBottomCaptions((prev) => [...prev, ""])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {bottomCaptions.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="예: 결국 또 지각각..."
                          value={value}
                          onChange={(e) =>
                            setBottomCaptions((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
                          }
                          data-testid={`input-caption-bottom-${index}`}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            setBottomCaptions((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {bottomCaptions.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-1.5 text-xs"
                        onClick={() => setBottomCaptions([""])}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        하단 자막 추가
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "bubbles" && (
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">말풍선 설정</h3>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={addSpeechBubble}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1.5 mb-3">
                {bubblePage.bubbles.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    말풍선을 추가하고 캔버스에서 자유롭게 움직여보세요.
                  </p>
                ) : (
                  bubblePage.bubbles.map((b, index) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer text-xs ${
                        selectedBubbleId === b.id ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedBubbleId(b.id)}
                    >
                      <span className="truncate">
                        말풍선 {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBubblePage((prev) => ({
                            ...prev,
                            bubbles: prev.bubbles.filter((x) => x.id !== b.id),
                          }));
                          if (selectedBubbleId === b.id) {
                            setSelectedBubbleId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {selectedBubbleId && (
                <div className="mt-2 space-y-3 border-t pt-3">
                  {(() => {
                    const selected = bubblePage.bubbles.find((b) => b.id === selectedBubbleId);
                    if (!selected) return null;
                    return (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">말풍선 텍스트</Label>
                          <Textarea
                            value={selected.text}
                            onChange={(e) =>
                              updateSpeechBubble(selected.id, { text: e.target.value })
                            }
                            className="h-20 text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">폰트</Label>
                          <Select
                            value={selected.fontKey}
                            onValueChange={(v) =>
                              updateSpeechBubble(selected.id, { fontKey: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFonts.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  <span style={{ fontFamily: f.family }}>{f.label}</span>
                                </SelectItem>
                              ))}
                              {!canAllFontsInstatoon && (
                                <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                                  Pro 멤버십 또는 프로 연재러(30회+) 등급에서 전체 폰트 해금
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">글자 크기</Label>
                            <span className="text-[11px] text-muted-foreground">
                              {selected.fontSize}px
                            </span>
                          </div>
                          <Slider
                            value={[selected.fontSize]}
                            onValueChange={([v]) =>
                              updateSpeechBubble(selected.id, { fontSize: v })
                            }
                            min={8}
                            max={40}
                            step={1}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px]">스타일</Label>
                            <Select
                              value={selected.style}
                              onValueChange={(v) =>
                                updateSpeechBubble(selected.id, {
                                  style: v as BubbleStyle,
                                  seed: Math.floor(Math.random() * 1000000),
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STYLE_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">꼬리 방향</Label>
                            <Select
                              value={selected.tailDirection}
                              onValueChange={(v: any) =>
                                updateSpeechBubble(selected.id, { tailDirection: v })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bottom">아래</SelectItem>
                                <SelectItem value="top">위</SelectItem>
                                <SelectItem value="left">왼쪽</SelectItem>
                                <SelectItem value="right">오른쪽</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          캔버스에서 말풍선 테두리와 꼬리 끝을 드래그하면 크기와 꼬리를 조절할 수 있습니다.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-4 flex flex-col items-center justify-center min-h-[500px]">
            {generateMutation.isPending && !baseImageForCanvas ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="w-full aspect-[3/4] rounded-md" />
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">인스타툰 장면을 생성하는 중...</p>
                </div>
              </div>
            ) : baseImageForCanvas ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="overflow-hidden rounded-md border bg-white w-full">
                  <BubbleCanvas
                    page={bubblePage}
                    isActive
                    zoom={zoom}
                    onUpdateBubble={(id, u) => updateSpeechBubble(id, u)}
                    onUpdateChar={() => {}}
                    onSelectBubble={(id) => setSelectedBubbleId(id)}
                    onSelectChar={() => {}}
                    selectedBubbleId={selectedBubbleId}
                    selectedCharId={null}
                    onCanvasRef={(el) => {
                      canvasRef.current = el;
                    }}
                    showWatermark={false}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleDownload}
                    disabled={!canDownload}
                    data-testid="button-download-instatoon"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">인스타툰 결과가 여기에 표시돼요</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  이미지를 선택하고 프롬프트와 자막을 입력한 뒤 인스타툰을 생성해보세요.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const totalHeight = lineHeight * lines.length;
  let startY = y - totalHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, x, startY);
    startY += lineHeight;
  }
}
