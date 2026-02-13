import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useSearch } from "wouter";
import { Upload, Download, RotateCcw, Eye, ArrowRight, ArrowLeft } from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { getFlowState } from "@/lib/flow";

type BlurType = "gaussian" | "motion" | "radial";

const BLUR_TYPES: { value: BlurType; label: string; labelKo: string }[] = [
  { value: "gaussian", label: "가우시안", labelKo: "가우시안 블러" },
  { value: "motion", label: "모션", labelKo: "모션 블러" },
  { value: "radial", label: "방사형", labelKo: "방사형 블러" },
];

export default function EffectsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const effectsParams = new URLSearchParams(search);
  const isFlow = effectsParams.get("flow") === "1";
  const [, navigate] = useLocation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [blurType, setBlurType] = useState<BlurType>("gaussian");
  const [strength, setStrength] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const { data: usageData } = useQuery<{creatorTier: number; totalGenerations: number; tier: string}>({ queryKey: ["/api/usage"] });
  const isPro = usageData?.tier === "pro";

  useEffect(() => {
    if (isFlow && !uploadedImage) {
      const flow = getFlowState();
      if (flow.lastPoseImageUrl) {
        setUploadedImage(flow.lastPoseImageUrl);
      }
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "잘못된 파일", description: "이미지 파일을 업로드해주세요.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setStrength(0);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!uploadedImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      const maxW = 800;
      const maxH = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }
      setCanvasSize({ width: Math.round(w), height: Math.round(h) });
    };
    img.src = uploadedImage;
  }, [uploadedImage]);

  const applyBlur = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    if (strength === 0) {
      ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
      return;
    }

    setIsProcessing(true);

    requestAnimationFrame(() => {
      const w = canvasSize.width;
      const h = canvasSize.height;

      if (blurType === "gaussian") {
        ctx.filter = `blur(${strength}px)`;
        ctx.drawImage(img, -strength * 2, -strength * 2, w + strength * 4, h + strength * 4);
        ctx.filter = "none";
      } else if (blurType === "motion") {
        const passes = Math.max(1, Math.floor(strength * 1.5));
        const angle = 0;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1 / (passes + 1);
        for (let i = -passes; i <= passes; i++) {
          const offsetX = dx * i * (strength / passes) * 2;
          const offsetY = dy * i * (strength / passes) * 2;
          ctx.drawImage(img, offsetX, offsetY, w, h);
        }
        ctx.globalAlpha = 1.0;
      } else if (blurType === "radial") {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.drawImage(img, 0, 0, w, h);

        ctx.clearRect(0, 0, w, h);
        const passes = Math.max(2, Math.floor(strength));
        const centerX = w / 2;
        const centerY = h / 2;

        ctx.globalAlpha = 1 / (passes + 1);
        for (let i = 0; i <= passes; i++) {
          const scale = 1 + (i / passes) * (strength / 100);
          const sw = w * scale;
          const sh = h * scale;
          const sx = centerX - sw / 2;
          const sy = centerY - sh / 2;
          ctx.drawImage(tempCanvas, sx, sy, sw, sh);
        }
        ctx.globalAlpha = 1.0;
      }

      setIsProcessing(false);
    });
  }, [blurType, strength, canvasSize]);

  useEffect(() => {
    applyBlur();
  }, [applyBlur]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `charagen-${blurType}-blur-${strength}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "다운로드 완료!", description: "이미지가 저장되었습니다." });
  };

  const handleReset = () => {
    setStrength(0);
    setBlurType("gaussian");
  };

  const handleClear = () => {
    setUploadedImage(null);
    setStrength(0);
    setBlurType("gaussian");
    originalImageRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
          <Eye className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3" data-testid="text-login-required-effects">로그인이 필요합니다</h2>
        <p className="text-muted-foreground mb-6">블러 효과 도구를 사용하려면 로그인하세요.</p>
        <Button asChild data-testid="button-login-effects">
          <a href="/login" className="gap-2">
            로그인
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="editor-page mx-auto max-w-6xl px-4 py-8">
      {isFlow && <FlowStepper currentStep={4} />}
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold tracking-tight" data-testid="text-effects-title">블러 효과</h1>
        <p className="mt-2 text-muted-foreground">이미지에 블러 효과를 적용해보세요 (Gaussian / Motion / Radial)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <Label className="text-sm font-medium mb-3 block" data-testid="label-upload">이미지 업로드</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
            {!uploadedImage ? (
              <div
                className="w-full border border-dashed rounded-md flex flex-col items-center justify-center gap-2 py-10 cursor-pointer hover-elevate"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-trigger"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">클릭하여 이미지 업로드</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-change-image"
                >
                  <Upload className="h-3.5 w-3.5" />
                  변경
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleClear}
                  data-testid="button-clear-image"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </Card>

          {uploadedImage && (
            <>
              <Card className="p-4">
                <Label className="text-sm font-medium mb-3 block" data-testid="label-blur-type">블러 타입</Label>
                <div className="flex flex-col gap-2">
                  {BLUR_TYPES.map((bt) => (
                    <Button
                      key={bt.value}
                      variant={blurType === bt.value ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setBlurType(bt.value)}
                      data-testid={`button-blur-${bt.value}`}
                    >
                      <span className="font-semibold">{bt.label}</span>
                      <span className="text-xs opacity-70">{bt.labelKo}</span>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium" data-testid="label-strength">강도</Label>
                  <Badge variant="secondary" data-testid="badge-strength-value">{strength}</Badge>
                </div>
                <Slider
                  value={[strength]}
                  onValueChange={(v) => setStrength(v[0])}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                  data-testid="slider-strength"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">0</span>
                  <span className="text-xs text-muted-foreground">20</span>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={handleReset}
                  data-testid="button-reset-effects"
                >
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </Button>
                <Button
                  className="flex-1 gap-1"
                  onClick={handleDownload}
                  disabled={!uploadedImage || isProcessing}
                  data-testid="button-download-effect"
                >
                  <Download className="h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </>
          )}
        </div>

        <Card className="p-4 flex items-center justify-center min-h-[400px]">
          {!uploadedImage ? (
            <div className="text-center text-muted-foreground" data-testid="text-no-image">
              <Eye className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">이미지 없음</p>
              <p className="text-sm mt-1">블러 효과를 적용할 이미지를 업로드하세요</p>
            </div>
          ) : (
            <div className="relative w-full flex items-center justify-center">
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-md">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "560px",
                  borderRadius: "6px",
                }}
                data-testid="canvas-preview"
              />
            </div>
          )}
        </Card>
      </div>
      {isFlow && (
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/background?flow=1")} data-testid="button-flow-prev">
            <ArrowLeft className="h-4 w-4" /> 배경/아이템
          </Button>
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => navigate("/story?flow=1")} data-testid="button-flow-next">
            스토리 편집 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
