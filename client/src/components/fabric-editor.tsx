import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Circle, Ellipse, Triangle, Group, Textbox, Image, FabricObject, Shadow, Polygon } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Mode = "idle" | "crop";

export default function FabricEditor({ isPro = false, className, onClose }: { isPro?: boolean; className?: string; onClose?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("idle");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const cropRectRef = useRef<Rect | null>(null);
  const [fontFamily, setFontFamily] = useState("Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif");
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [maskEnabled, setMaskEnabled] = useState(false);
  const [overlapEnabled, setOverlapEnabled] = useState(false);
  const panelRectRef = useRef<Rect | null>(null);
  const handleMapRef = useRef<Map<Group, Circle>>(new Map());
  const KOREAN_FONT_OPTIONS = [
    { label: "기본 고딕", family: "Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
    { label: "프리텐다드", family: "Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
    { label: "지마켓 산스", family: "GMarketSans, Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
    { label: "미모먼트 꾸꾸꾸", family: "MemomentKkukkukk, Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
    { label: "카페24 서라운드", family: "Cafe24Surround, Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new Canvas(canvasRef.current, {
      width: canvasRef.current.parentElement?.clientWidth || 800,
      height: canvasRef.current.parentElement?.clientHeight || 600,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = c;

    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = c.getActiveObjects();
        active.forEach((o: FabricObject) => c.remove(o));
        c.discardActiveObject();
        c.requestRenderAll();
      }
    };
    window.addEventListener("keydown", keydown);

    const dbl = (opt: any) => {
      const target = opt.target;
      if (target && target.type === "image" && mode === "idle") {
        setMode("crop");
        const img = target as Image;
        const bounds = img.getBoundingRect();
        const r = new Rect({
          left: bounds.left + 40,
          top: bounds.top + 40,
          width: Math.max(100, bounds.width - 80),
          height: Math.max(100, bounds.height - 80),
          fill: "rgba(0,0,0,0.1)",
          stroke: "#4f46e5",
          strokeWidth: 2,
          transparentCorners: false,
          hasRotatingPoint: false,
          cornerColor: "#4f46e5",
          cornerStyle: "circle",
          selectable: true,
          objectCaching: false,
        });
        cropRectRef.current = r;
        c.add(r);
        c.setActiveObject(r);
      }
    };
    c.on("mouse:dblclick", dbl);

    return () => {
      window.removeEventListener("keydown", keydown);
      c.dispose();
    };
  }, []);

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = bgColor as any;
      fabricRef.current.renderAll();
    }
  }, [bgColor]);

  const addRect = () => {
    const c = fabricRef.current;
    if (!c) return;
    const r = new Rect({
      left: 100,
      top: 100,
      width: 160,
      height: 100,
      fill: "#dbeafe",
      stroke: "#1d4ed8",
      strokeWidth: 2,
    });
    c.add(r);
    c.setActiveObject(r);
    c.requestRenderAll();
  };

  const addCircle = () => {
    const c = fabricRef.current;
    if (!c) return;
    const ci = new Circle({
      left: 160,
      top: 160,
      radius: 60,
      fill: "#fef3c7",
      stroke: "#ea580c",
      strokeWidth: 2,
    });
    c.add(ci);
    c.setActiveObject(ci);
    c.requestRenderAll();
  };

  const addText = () => {
    const c = fabricRef.current;
    if (!c) return;
    const t = new Textbox("텍스트", {
      left: 120,
      top: 80,
      fontSize: 32,
      fill: "#111827",
      fontFamily: "Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif",
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth,
    });
    if (shadowBlur > 0) {
      t.set("shadow", new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY }));
    }
    c.add(t);
    c.setActiveObject(t);
    c.requestRenderAll();
  };

  const addImage = (file: File) => {
    const c = fabricRef.current;
    if (!c) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      Image.fromURL(url).then((img: Image) => {
        img.set({
          left: 200,
          top: 120,
          selectable: true,
        });
        const iw = img.width ?? 1;
        const ih = img.height ?? 1;
        const scale = Math.min(500 / iw, 400 / ih);
        img.scale(scale);
        c.add(img);
        c.setActiveObject(img);
        c.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const onExportPNG = () => {
    const c = fabricRef.current;
    if (!c) return;
    const data = c.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };

  const onSaveJSON = () => {
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onLoadJSON = (file: File) => {
    const c = fabricRef.current;
    if (!c) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      c.loadFromJSON(json, () => {
        c.renderAll();
      });
    };
    reader.readAsText(file);
  };

  const addSpeechBubble = () => {
    const c = fabricRef.current;
    if (!c) return;
    const centerX = 400;
    const centerY = 300;
    const rx = 120;
    const ry = 70;
    const ellipse = new Ellipse({ left: centerX, top: centerY, rx, ry, fill: "#ffffff", stroke: "#111827", strokeWidth: 3, originX: "center", originY: "center" });
    const text = new Textbox("텍스트", { left: centerX, top: centerY, originX: "center", originY: "center", fontSize: 24, textAlign: "center", width: rx * 1.6, fontFamily });
    const tip = { x: centerX + 150, y: centerY + 80 };
    const baseWidth = 28;
    const computeBase = (cx: number, cy: number, rxv: number, ryv: number, tx: number, ty: number) => {
      const dx = tx - cx;
      const dy = ty - cy;
      const denom = Math.sqrt((dx * dx) / (rxv * rxv) + (dy * dy) / (ryv * ryv)) || 1;
      const t = 1 / denom;
      const bx = cx + dx * t;
      const by = cy + dy * t;
      const nx = -dy;
      const ny = dx;
      const nlen = Math.hypot(nx, ny) || 1;
      const ux = (nx / nlen) * (baseWidth / 2);
      const uy = (ny / nlen) * (baseWidth / 2);
      const a = { x: bx + ux, y: by + uy };
      const b = { x: bx - ux, y: by - uy };
      return { a, b };
    };
    const bases = computeBase(centerX, centerY, rx, ry, tip.x, tip.y);
    const tail = new Polygon([{ x: bases.a.x - centerX, y: bases.a.y - centerY }, { x: tip.x - centerX, y: tip.y - centerY }, { x: bases.b.x - centerX, y: bases.b.y - centerY }], { left: centerX, top: centerY, originX: "center", originY: "center", fill: "#ffffff", stroke: "#111827", strokeWidth: 3 });
    const group = new Group([ellipse, tail, text], { left: centerX, top: centerY, originX: "center", originY: "center" });
    c.add(group);
    const handle = new Circle({ left: tip.x, top: tip.y, radius: 6, fill: "#10b981", stroke: "#065f46", strokeWidth: 2, originX: "center", originY: "center", hasBorders: false });
    handleMapRef.current.set(group, handle);
    c.add(handle);
    const syncHandle = () => {
      const gCenter = group.getCenterPoint();
      const pts = (tail as Polygon).points!;
      const px = pts[1].x + gCenter.x;
      const py = pts[1].y + gCenter.y;
      handle.set({ left: px, top: py });
      handle.setCoords();
      c.requestRenderAll();
    };
    group.on("moving", syncHandle);
    group.on("scaling", syncHandle);
    group.on("rotating", syncHandle);
    text.on("changed", () => {
      const padX = 30;
      const padY = 24;
      const bw = text.width ?? 0;
      const bh = text.height ?? 0;
      ellipse.set({ rx: Math.max(60, bw / 2 + padX), ry: Math.max(40, bh / 2 + padY) });
      const gc = group.getCenterPoint();
      const hx = handle.left ?? gc.x;
      const hy = handle.top ?? gc.y;
      const b2 = computeBase(gc.x, gc.y, ellipse.rx!, ellipse.ry!, hx, hy);
      const pts = [{ x: b2.a.x - gc.x, y: b2.a.y - gc.y }, { x: hx - gc.x, y: hy - gc.y }, { x: b2.b.x - gc.x, y: b2.b.y - gc.y }];
      (tail as Polygon).set({ points: pts });
      c.requestRenderAll();
    });
    handle.on("moving", () => {
      const gc = group.getCenterPoint();
      const hx = handle.left ?? gc.x;
      const hy = handle.top ?? gc.y;
      const b2 = computeBase(gc.x, gc.y, ellipse.rx!, ellipse.ry!, hx, hy);
      const pts = [{ x: b2.a.x - gc.x, y: b2.a.y - gc.y }, { x: hx - gc.x, y: hy - gc.y }, { x: b2.b.x - gc.x, y: b2.b.y - gc.y }];
      (tail as Polygon).set({ points: pts });
      c.requestRenderAll();
    });
    c.setActiveObject(group);
    c.requestRenderAll();
  };

  const applyTextEffects = () => {
    const c = fabricRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj && obj.type === "textbox") {
      const t = obj as Textbox;
      t.set("stroke", strokeWidth > 0 ? strokeColor : undefined);
      t.set("strokeWidth", strokeWidth);
      t.set("fontFamily", fontFamily);
      t.set("charSpacing", Math.max(0, Math.round(letterSpacing * 100)));
      t.set("lineHeight", lineHeight);
      if (shadowBlur > 0) {
        t.set("shadow", new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY }));
      } else {
        t.set("shadow", undefined);
      }
      c.requestRenderAll();
    }
  };

  const applyCrop = () => {
    const c = fabricRef.current;
    if (!c) return;
    const img = c.getObjects("image")[0] as Image | undefined;
    const r = cropRectRef.current;
    if (!img || !r) {
      setMode("idle");
      return;
    }
    const clip = new Rect({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      absolutePositioned: true,
    });
    img.clipPath = clip;
    c.remove(r);
    cropRectRef.current = null;
    setMode("idle");
    c.requestRenderAll();
  };

  const cancelCrop = () => {
    const c = fabricRef.current;
    if (!c) return;
    const r = cropRectRef.current;
    if (r) c.remove(r);
    cropRectRef.current = null;
    setMode("idle");
    c.requestRenderAll();
  };

  const addPanelRect = () => {
    const c = fabricRef.current;
    if (!c) return;
    if (panelRectRef.current) c.remove(panelRectRef.current);
    const r = new Rect({ left: 150, top: 90, width: 500, height: 380, fill: "rgba(59,130,246,0.06)", stroke: "#3b82f6", strokeWidth: 2 });
    panelRectRef.current = r;
    c.add(r);
    c.setActiveObject(r);
    c.requestRenderAll();
  };

  const toggleMask = () => {
    const c = fabricRef.current;
    if (!c) return;
    if (!panelRectRef.current) return;
    if (maskEnabled) {
      c.clipPath = undefined as any;
      setMaskEnabled(false);
    } else {
      const pr = panelRectRef.current;
      const clip = new Rect({ left: pr.left, top: pr.top, width: pr.width, height: pr.height, absolutePositioned: true });
      c.clipPath = clip;
      setMaskEnabled(true);
    }
    c.requestRenderAll();
  };

  const toggleOverlap = () => {
    const c = fabricRef.current;
    if (!c) return;
    setOverlapEnabled((v) => !v);
    if (overlapEnabled) return;
    c.clipPath = undefined as any;
    setMaskEnabled(false);
    c.requestRenderAll();
  };

  const removeBgApprox = () => {
    if (!isPro) {
      toast({
        title: "Pro 전용 기능",
        description: "배경 제거는 Pro 멤버십 전용 기능입니다.",
        variant: "destructive",
      });
      return;
    }
    const c = fabricRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj || obj.type !== "image") return;
    const img = obj as Image;
    const el = img.getElement() as HTMLImageElement | HTMLCanvasElement;
    const w = el.width || img.width || 0;
    const h = el.height || img.height || 0;
    if (!w || !h) return;
    const oc = document.createElement("canvas");
    oc.width = w;
    oc.height = h;
    const ctx = oc.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const a = d[i + 3];
      const brightness = (r + g + b) / 3;
      if (brightness > 245 && a > 10) {
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const url = oc.toDataURL("image/png");
    Image.fromURL(url).then((nimg) => {
      nimg.set({ left: img.left, top: img.top, scaleX: img.scaleX, scaleY: img.scaleY, angle: img.angle, selectable: true });
      c.remove(img);
      c.add(nimg);
      c.setActiveObject(nimg);
      c.requestRenderAll();
    });
  };

  return (
    <div className={`flex h-full w-full gap-3 ${className}`}>
      <div className="flex flex-col w-52 gap-2">
        <div className="rounded-lg border p-3 flex flex-col gap-2">
          <Button variant="secondary" onClick={addRect}>사각형 추가</Button>
          <Button variant="secondary" onClick={addCircle}>원 추가</Button>
          <Button variant="secondary" onClick={addText}>텍스트 추가</Button>
          <Button variant="secondary" onClick={addSpeechBubble}>말풍선 추가</Button>
          <label className="block">
            <Input type="file" accept="image/*" onChange={(e) => e.target.files && addImage(e.target.files[0])} />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addPanelRect}>패널 추가</Button>
            <Button variant="outline" onClick={toggleMask}>{maskEnabled ? "마스크 해제" : "마스크 적용"}</Button>
          </div>
          <Button variant="outline" onClick={toggleOverlap}>{overlapEnabled ? "오버랩 끄기" : "오버랩 켜기"}</Button>
          <Button variant="secondary" onClick={removeBgApprox}>배경 제거(간이)</Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="mt-2 text-muted-foreground">
              닫기
            </Button>
          )}
        </div>
        <div className="rounded-lg border p-3 flex flex-col gap-3">
          <Label>배경색</Label>
          <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
        </div>
        <div className="rounded-lg border p-3 flex flex-col gap-3">
          <Label>텍스트 외곽선 색</Label>
          <Input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
          <Label>텍스트 외곽선 두께</Label>
          <Slider value={[strokeWidth]} min={0} max={10} step={1} onValueChange={(v) => setStrokeWidth(v[0])} />
          <Label>그림자 색</Label>
          <Input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} />
          <Label>그림자 흐림</Label>
          <Slider value={[shadowBlur]} min={0} max={30} step={1} onValueChange={(v) => setShadowBlur(v[0])} />
          <Label>그림자 X</Label>
          <Slider value={[shadowOffsetX]} min={-30} max={30} step={1} onValueChange={(v) => setShadowOffsetX(v[0])} />
          <Label>그림자 Y</Label>
          <Slider value={[shadowOffsetY]} min={-30} max={30} step={1} onValueChange={(v) => setShadowOffsetY(v[0])} />
          <Label>폰트</Label>
          <Select value={fontFamily} onValueChange={(v) => setFontFamily(v)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KOREAN_FONT_OPTIONS.map((f) => (
                <SelectItem key={f.family} value={f.family}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>자간</Label>
          <Slider value={[letterSpacing]} min={0} max={10} step={0.5} onValueChange={(v) => setLetterSpacing(v[0])} />
          <Label>행간</Label>
          <Slider value={[lineHeight]} min={0.8} max={2} step={0.05} onValueChange={(v) => setLineHeight(v[0])} />
          <Button onClick={applyTextEffects}>적용</Button>
        </div>
        <div className="rounded-lg border p-3 flex flex-col gap-2">
          {mode === "crop" ? (
            <div className="flex gap-2">
              <Button variant="default" onClick={applyCrop}>크롭 적용</Button>
              <Button variant="secondary" onClick={cancelCrop}>취소</Button>
            </div>
          ) : (
            <Button onClick={onExportPNG}>PNG 내보내기</Button>
          )}
          <Button variant="outline" onClick={onSaveJSON}>JSON 저장</Button>
          <label className="block">
            <Input type="file" accept="application/json" onChange={(e) => e.target.files && onLoadJSON(e.target.files[0])} />
          </label>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="p-4 bg-gray-100 rounded-lg border w-full h-full flex items-center justify-center overflow-auto">
          <canvas ref={canvasRef} className="bg-white shadow rounded" />
        </div>
      </div>
    </div>
  );
}
