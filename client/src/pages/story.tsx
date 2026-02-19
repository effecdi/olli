import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Plus,
  Trash2,
  Wand2,
  RotateCcw,
  Lightbulb,
  MessageSquare,
  ImageIcon,
  Download,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  X,
  Type,
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  Minimize2,
  LayoutGrid,
  Maximize,
  BookOpen,
  Share2,
  FolderOpen,
  Crown,
  Loader2,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { EditorOnboarding } from "@/components/editor-onboarding";
import { getFlowState, clearFlowState } from "@/lib/flow";
import type { StoryPanelScript, Generation } from "@shared/schema";
import ReactFlow, { Background, Controls, type Node, type NodeChange, applyNodeChanges } from "reactflow";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KOREAN_FONTS, FONT_CSS, getFontFamily, getDefaultTailTip, getTailGeometry, drawBubble, STYLE_LABELS, FLASH_STYLE_LABELS, TAIL_LABELS } from "@/lib/bubble-utils";
import { SpeechBubble, BubbleStyle, TailStyle, TailDrawMode } from "@/lib/bubble-types";

function bubblePath(n: number) {
  return `/assets/bubbles/bubble_${String(n).padStart(3, "0")}.png`;
}

type TemplateCategory = { label: string; ids: number[] };
const BUBBLE_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { label: "말풍선 (외침/효과)", ids: [109, 110, 111, 112, 113] },
  { label: "이펙트 / 스티커", ids: [108, 114, 115, 116, 117] },
];

type ScriptStyle = "filled" | "box" | "handwritten-box" | "no-bg" | "no-border";
type DragMode =
  | null
  | "move"
  | "resize-br"
  | "resize-bl"
  | "resize-tr"
  | "resize-tl"
  | "resize-r"
  | "resize-l"
  | "resize-t"
  | "resize-b"
  | "move-char"
  | "resize-char-tl"
  | "resize-char-tr"
  | "resize-char-bl"
  | "resize-char-br"
  | "rotate-char"
  | "move-script-top"
  | "move-script-bottom"
  | "resize-script-top"
  | "resize-script-bottom"
  | "move-tail"
  | "tail-ctrl1"
  | "tail-ctrl2";

const SCRIPT_STYLE_OPTIONS: { value: ScriptStyle; label: string }[] = [
  { value: "filled", label: "채움" },
  { value: "box", label: "박스라인" },
  { value: "handwritten-box", label: "손글씨 박스" },
  { value: "no-bg", label: "배경없음" },
  { value: "no-border", label: "라인없음" },
];

const SCRIPT_COLOR_OPTIONS = [
  {
    value: "yellow",
    label: "노랑",
    bg: "rgba(250, 204, 21, 0.9)",
    text: "#1a1a1a",
    border: "rgba(202, 160, 0, 0.8)",
  },
  {
    value: "sky",
    label: "하늘",
    bg: "rgba(56, 189, 248, 0.9)",
    text: "#1a1a1a",
    border: "rgba(14, 145, 210, 0.8)",
  },
  {
    value: "pink",
    label: "분홍",
    bg: "rgba(244, 114, 182, 0.9)",
    text: "#1a1a1a",
    border: "rgba(210, 70, 140, 0.8)",
  },
  {
    value: "green",
    label: "초록",
    bg: "rgba(74, 222, 128, 0.9)",
    text: "#1a1a1a",
    border: "rgba(34, 170, 80, 0.8)",
  },
  {
    value: "orange",
    label: "주황",
    bg: "rgba(251, 146, 60, 0.9)",
    text: "#1a1a1a",
    border: "rgba(210, 110, 30, 0.8)",
  },
  {
    value: "purple",
    label: "보라",
    bg: "rgba(167, 139, 250, 0.9)",
    text: "#1a1a1a",
    border: "rgba(120, 90, 220, 0.8)",
  },
  {
    value: "white",
    label: "흰색",
    bg: "rgba(255, 255, 255, 0.95)",
    text: "#1a1a1a",
    border: "rgba(200, 200, 200, 0.8)",
  },
  {
    value: "dark",
    label: "어두운",
    bg: "rgba(30, 30, 30, 0.9)",
    text: "#ffffff",
    border: "rgba(80, 80, 80, 0.8)",
  },
];

const FLOW_NODE_STYLE_CHAR = {
  width: 80,
  height: 40,
  border: "1px solid hsl(150, 80%, 40%)",
  borderRadius: 8,
  background: "white",
  fontSize: 12,
};
const FLOW_NODE_STYLE_BUBBLE = {
  width: 100,
  height: 40,
  border: "1px solid hsl(200, 70%, 40%)",
  borderRadius: 8,
  background: "white",
  fontSize: 12,
};

const SCRIPT_TEXT_COLORS = [
  { value: "", label: "자동", hex: "" },
  { value: "#1a1a1a", label: "검정", hex: "#1a1a1a" },
  { value: "#ffffff", label: "흰색", hex: "#ffffff" },
  { value: "#dc2626", label: "빨강", hex: "#dc2626" },
  { value: "#2563eb", label: "파랑", hex: "#2563eb" },
  { value: "#16a34a", label: "초록", hex: "#16a34a" },
  { value: "#9333ea", label: "보라", hex: "#9333ea" },
  { value: "#ea580c", label: "주황", hex: "#ea580c" },
];

const BUBBLE_COLOR_PRESETS = [
  { label: "흰색", fill: "#ffffff", stroke: "#222222" },
  { label: "검정", fill: "#1a1a1a", stroke: "#000000" },
  { label: "노랑", fill: "#fef08a", stroke: "#ca8a04" },
  { label: "하늘", fill: "#bae6fd", stroke: "#0ea5e9" },
  { label: "분홍", fill: "#fecdd3", stroke: "#e11d48" },
  { label: "연두", fill: "#bbf7d0", stroke: "#16a34a" },
  { label: "보라", fill: "#e9d5ff", stroke: "#9333ea" },
  { label: "주황", fill: "#fed7aa", stroke: "#ea580c" },
  { label: "투명", fill: "transparent", stroke: "#222222" },
];

 
interface CharacterPlacement {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  width?: number;   // explicit pixel width (optional, overrides scale if set)
  height?: number;  // explicit pixel height
  rotation?: number;
  imageEl: HTMLImageElement | null;
  zIndex?: number;
  locked?: boolean;
}

interface ScriptData {
  text: string;
  style: ScriptStyle;
  color: string;
  fontSize?: number;
  fontKey?: string;
  textColor?: string;
  bold?: boolean;
  x?: number;
  y?: number;
}

interface PanelData {
  id: string;
  topScript: ScriptData | null;
  bottomScript: ScriptData | null;
  bubbles: SpeechBubble[];
  characters: CharacterPlacement[];
  backgroundImageUrl?: string;
  backgroundImageEl?: HTMLImageElement | null;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createBubble(
  canvasW: number,
  canvasH: number,
  text = "",
  style: BubbleStyle = "handwritten",
): SpeechBubble {
  return {
    id: generateId(),
    seed: Math.floor(Math.random() * 1000000),
    x: canvasW / 2 - 70,
    y: canvasH / 2 - 30,
    width: 140,
    height: 60,
    text,
    style,
    tailStyle: "short",
    tailDirection: "bottom",
    tailBaseSpread: 8,
    tailLength: undefined,
    tailCurve: 0.5,
    tailJitter: 1,
    dotsScale: 1,
    dotsSpacing: 1,
    strokeWidth: 2,
    wobble: 5,
    fontSize: 15,
    fontKey: "default",
    zIndex: 10,
  };
}

function createPanel(): PanelData {
  return {
    id: generateId(),
    topScript: null,
    bottomScript: null,
    bubbles: [],
    characters: [],
    backgroundImageUrl: undefined,
    backgroundImageEl: null,
  };
}

function drawHandwrittenPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  sw: number,
  seed: number,
) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rx = w / 2,
    ry = h / 2,
    cx = x + rx,
    cy = y + ry;
  const segments = 60;
  const rand = seededRandom(seed);
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jx = (rand() - 0.5) * sw * 1.5;
    const jy = (rand() - 0.5) * sw * 1.5;
    const px = cx + Math.cos(angle) * rx + jx;
    const py = cy + Math.sin(angle) * ry + jy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawLinedrawingPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  sw: number,
) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function drawWobblyPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  sw: number,
  wobble: number,
) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rx = w / 2,
    ry = h / 2,
    cx = x + rx,
    cy = y + ry;
  const segments = 80;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wx = Math.sin(angle * 6) * wobble;
    const wy = Math.cos(angle * 8) * wobble * 0.7;
    const px = cx + Math.cos(angle) * (rx + wx);
    const py = cy + Math.sin(angle) * (ry + wy);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawThoughtPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number, seed: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
  const bumps = 16;
  const bumpSize = Math.min(rx, ry) * 0.18;
  const rand = seededRandom(seed);
  ctx.beginPath();
  for (let i = 0; i <= bumps * 4; i++) {
    const t = i / (bumps * 4);
    const angle = t * Math.PI * 2;
    const bumpAngle = angle * bumps;
    const bump = Math.abs(Math.cos(bumpAngle)) * bumpSize + (rand() - 0.5) * bumpSize * 0.3;
    const px = cx + Math.cos(angle) * (rx + bump);
    const py = cy + Math.sin(angle) * (ry + bump);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawShoutPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number, seed: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "miter";
  ctx.lineCap = "round";
  const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
  const spikes = 12;
  const rand = seededRandom(seed);
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const isSpike = i % 2 === 0;
    const spikeLen = isSpike ? 0.25 + rand() * 0.15 : 0;
    const r = isSpike ? 1 + spikeLen : 0.82;
    const px = cx + Math.cos(angle) * rx * r;
    const py = cy + Math.sin(angle) * ry * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawRectanglePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.closePath();
}

function drawRoundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const r = Math.min(w, h) * 0.2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDoublelinePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();
  const gap = sw * 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - gap, ry - gap, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function drawWavyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sw: number) {
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
  const waves = 10;
  const waveAmp = Math.min(rx, ry) * 0.08;
  const segments = 120;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wave = Math.sin(angle * waves) * waveAmp;
    const px = cx + Math.cos(angle) * (rx + wave);
    const py = cy + Math.sin(angle) * (ry + wave);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function getScriptRect(
  ctx: CanvasRenderingContext2D,
  script: ScriptData,
  type: "top" | "bottom",
  canvasW: number,
  canvasH: number,
) {
  const fs = script.fontSize || 20;
  const padX = Math.max(14, fs * 1.1);
  const padY = Math.max(6, fs * 0.5);
  const fontFamily = getFontFamily(script.fontKey || "default");
  const weight = script.bold !== false ? "bold" : "normal";
  ctx.font = `${weight} ${fs}px ${fontFamily}`;
  const metrics = ctx.measureText(script.text || "");
  const bw = metrics.width + padX * 2;
  const bh = fs + padY * 2;
  const defaultX = canvasW / 2 - bw / 2;
  const defaultY = type === "top" ? 8 : canvasH - bh - 8;
  const bx = script.x !== undefined ? script.x : defaultX;
  const by = script.y !== undefined ? script.y : defaultY;
  return { bx, by, bw, bh, fs };
}

function drawScriptOverlay(
  ctx: CanvasRenderingContext2D,
  script: ScriptData,
  type: "top" | "bottom",
  canvasW: number,
  canvasH: number,
) {
  if (!script.text) return;
  ctx.save();

  const colorOpt =
    SCRIPT_COLOR_OPTIONS.find((c) => c.value === script.color) ||
    SCRIPT_COLOR_OPTIONS[0];
  const style = script.style || "filled";

  const { bx, by, bw, bh, fs } = getScriptRect(
    ctx,
    script,
    type,
    canvasW,
    canvasH,
  );
  const fontFamily = getFontFamily(script.fontKey || "default");
  const weight = script.bold !== false ? "bold" : "normal";
  ctx.font = `${weight} ${fs}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const r = 5;

  const drawRoundedRect = () => {
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    ctx.lineTo(bx + r, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
  };

  const drawWobblyRect = () => {
    const seed = script.text.length * 7 + (type === "top" ? 11 : 37);
    let s = seed;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return ((s - 1) / 2147483646) * 2 - 1;
    };
    const wobble = 1.8;
    ctx.beginPath();
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = bx + t * bw + rand() * wobble;
      const py = by + rand() * wobble;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = bx + bw + rand() * wobble;
      const py = by + t * bh + rand() * wobble;
      ctx.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const px = bx + t * bw + rand() * wobble;
      const py = by + bh + rand() * wobble;
      ctx.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const px = bx + rand() * wobble;
      const py = by + t * bh + rand() * wobble;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  if (style === "filled") {
    drawRoundedRect();
    ctx.fillStyle = colorOpt.bg;
    ctx.fill();
    ctx.strokeStyle = colorOpt.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (style === "box") {
    drawRoundedRect();
    ctx.fillStyle = colorOpt.bg.replace(/[\d.]+\)$/, "0.15)");
    ctx.fill();
    ctx.strokeStyle = colorOpt.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (style === "handwritten-box") {
    drawWobblyRect();
    ctx.fillStyle = colorOpt.bg.replace(/[\d.]+\)$/, "0.15)");
    ctx.fill();
    ctx.strokeStyle = colorOpt.border;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else if (style === "no-border") {
    drawRoundedRect();
    ctx.fillStyle = colorOpt.bg;
    ctx.fill();
  } else if (style === "no-bg") {
  }

  if (script.textColor) {
    ctx.fillStyle = script.textColor;
  } else if (style === "no-bg") {
    ctx.fillStyle = "#1a1a1a";
  } else {
    ctx.fillStyle = colorOpt.text;
  }
  ctx.fillText(script.text, bx + bw / 2, by + bh / 2);

  const handleSize = 10;
  const hx = bx + bw - 6;
  const hy = by + bh - 6;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(hx, hy, handleSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fill();
  ctx.strokeStyle = "hsl(173, 80%, 45%)";
  ctx.stroke();
  ctx.restore();
}

const CANVAS_W = 450;
const CANVAS_H = 600;

function PanelCanvas({
  panel,
  onUpdate,
  selectedBubbleId,
  onSelectBubble,
  selectedCharId,
  onSelectChar,
  canvasRef: externalCanvasRef,
  zoom,
  fontsReady,
  isPro,
  onEditBubble,
}: {
  panel: PanelData;
  onUpdate: (updated: PanelData) => void;
  selectedBubbleId: string | null;
  onSelectBubble: (id: string | null) => void;
  selectedCharId: string | null;
  onSelectChar: (id: string | null) => void;
  canvasRef?: (el: HTMLCanvasElement | null) => void;
  zoom?: number;
  fontsReady?: boolean;
  isPro: boolean;
  onEditBubble?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const dragModeRef = useRef<DragMode>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragBubbleStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragCharStartRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragScriptStartRef = useRef({ x: 0, y: 0 });
  const dragScriptFontStartRef = useRef(20);
  const selectedBubbleIdRef = useRef(selectedBubbleId);
  const selectedCharIdRef = useRef(selectedCharId);
  const panelRef = useRef(panel);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);

  useEffect(() => {
    selectedBubbleIdRef.current = selectedBubbleId;
  }, [selectedBubbleId]);
  useEffect(() => {
    selectedCharIdRef.current = selectedCharId;
  }, [selectedCharId]);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const toLoad = panel.bubbles.filter(
      (b) => b.style === "image" && b.templateSrc && !b.templateImg
    );
    if (toLoad.length === 0) return;
    toLoad.forEach((b) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        b.templateImg = img;
        redrawRef.current?.();
      };
      img.src = b.templateSrc!;
    });
  }, [panel.bubbles.length]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const p = panelRef.current;

    // Draw background image if present
    const bgImg = p.backgroundImageEl;
    if (bgImg) {
      const scale = Math.max(CANVAS_W / bgImg.naturalWidth, CANVAS_H / bgImg.naturalHeight);
      const sw = bgImg.naturalWidth * scale;
      const sh = bgImg.naturalHeight * scale;
      ctx.drawImage(bgImg, (CANVAS_W - sw) / 2, (CANVAS_H - sh) / 2, sw, sh);
    } else if (p.backgroundImageUrl) {
      // Fallback: try to draw from URL (will not block)
      const tmpImg = new Image();
      tmpImg.src = p.backgroundImageUrl;
      if (tmpImg.complete) {
        const scale = Math.max(CANVAS_W / tmpImg.naturalWidth, CANVAS_H / tmpImg.naturalHeight);
        const sw = tmpImg.naturalWidth * scale;
        const sh = tmpImg.naturalHeight * scale;
        ctx.drawImage(tmpImg, (CANVAS_W - sw) / 2, (CANVAS_H - sh) / 2, sw, sh);
      }
    }

    const drawables: Array<
      | { type: "char"; z: number; ch: CharacterPlacement }
      | { type: "bubble"; z: number; b: SpeechBubble }
    > = [
        ...p.characters.map((ch) => ({
          type: "char" as const,
          z: ch.zIndex ?? 0,
          ch,
        })),
        ...p.bubbles.map((b) => ({
          type: "bubble" as const,
          z: b.zIndex ?? 10,
          b,
        })),
      ];
    drawables.sort((a, b) => a.z - b.z);
    drawables.forEach((d) => {
      if (d.type === "char") {
        const ch = d.ch;
        if (ch.imageEl) {
          const w = ch.imageEl.naturalWidth * ch.scale;
          const h = ch.imageEl.naturalHeight * ch.scale;
          ctx.save();
          ctx.translate(ch.x, ch.y);
          ctx.rotate(ch.rotation || 0);
          ctx.drawImage(ch.imageEl, -w / 2, -h / 2, w, h);
          // selection box/handles now rendered in SVG overlay (not canvas)
          ctx.restore();
        }
      } else {
        const b = d.b;
        drawBubble(ctx, b, b.id === selectedBubbleIdRef.current);
      }
    });

    if (p.topScript)
      drawScriptOverlay(ctx, p.topScript, "top", CANVAS_W, CANVAS_H);
    if (p.bottomScript)
      drawScriptOverlay(ctx, p.bottomScript, "bottom", CANVAS_W, CANVAS_H);
    if (!isPro) {
      ctx.save();
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.font = "36px sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("OLLI Free", 0, 0);
      ctx.restore();
    }
  }, [isPro]);

  redrawRef.current = redraw;

  useEffect(() => {
    redraw();
  }, [panel, selectedBubbleId, selectedCharId, redraw, fontsReady]);

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CANVAS_W / rect.width),
      y: (clientY - rect.top) * (CANVAS_H / rect.height),
    };
  }, []);

  const getHandleAtPos = useCallback(
    (x: number, y: number, b: SpeechBubble): DragMode => {
      const hs = 10;

      if (b.tailStyle !== "none") {
        const geo = getTailGeometry(b);
        if (Math.abs(x - geo.tipX) < hs && Math.abs(y - geo.tipY) < hs) {
          return "move-tail";
        }
        const baseMidX = (geo.baseAx + geo.baseBx) / 2;
        const baseMidY = (geo.baseAy + geo.baseBy) / 2;
        const pull = 0.5 + (b.tailCurve ?? 0.5) * 0.45;
        const tipPull = 0.3;

        const cp1x = b.tailCtrl1X ?? (geo.baseAx + (baseMidX - geo.baseAx) * pull);
        const cp1y = b.tailCtrl1Y ?? (geo.baseAy + (baseMidY - geo.baseAy) * pull);
        const cp2x = b.tailCtrl2X ?? (geo.tipX + (baseMidX - geo.tipX) * tipPull);
        const cp2y = b.tailCtrl2Y ?? (geo.tipY + (baseMidY - geo.tipY) * tipPull);

        const hitRadius = 12;
        if (Math.hypot(x - cp1x, y - cp1y) < hitRadius) return "tail-ctrl1";
        if (Math.hypot(x - cp2x, y - cp2y) < hitRadius) return "tail-ctrl2";
      }

      const handles: { mode: DragMode; hx: number; hy: number }[] = [
        { mode: "resize-tl", hx: b.x - 4, hy: b.y - 4 },
        { mode: "resize-t", hx: b.x + b.width / 2, hy: b.y - 4 },
        { mode: "resize-tr", hx: b.x + b.width + 4, hy: b.y - 4 },
        { mode: "resize-r", hx: b.x + b.width + 4, hy: b.y + b.height / 2 },
        { mode: "resize-br", hx: b.x + b.width + 4, hy: b.y + b.height + 4 },
        { mode: "resize-b", hx: b.x + b.width / 2, hy: b.y + b.height + 4 },
        { mode: "resize-bl", hx: b.x - 4, hy: b.y + b.height + 4 },
        { mode: "resize-l", hx: b.x - 4, hy: b.y + b.height / 2 },
      ];
      for (const h of handles) {
        if (Math.abs(x - h.hx) < hs && Math.abs(y - h.hy) < hs) return h.mode;
      }
      return null;
    },
    [],
  );

  const updateBubbleInPanel = useCallback(
    (bubbleId: string, updates: Partial<SpeechBubble>) => {
      const p = panelRef.current;
      const newBubbles = p.bubbles.map((b) =>
        b.id === bubbleId ? { ...b, ...updates } : b,
      );
      onUpdate({ ...p, bubbles: newBubbles });
    },
    [onUpdate],
  );

  const updateCharInPanel = useCallback(
    (charId: string, updates: Partial<CharacterPlacement>) => {
      const p = panelRef.current;
      const newChars = p.characters.map((c) =>
        c.id === charId ? { ...c, ...updates } : c,
      );
      onUpdate({ ...p, characters: newChars });
    },
    [onUpdate],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      const pos = getCanvasPos(e.clientX, e.clientY);
      const p = panelRef.current;
      const sid = selectedBubbleIdRef.current;
      if (sid) {
        const selB = p.bubbles.find((b) => b.id === sid);
        if (selB && !selB.locked) {
          const handle = getHandleAtPos(pos.x, pos.y, selB);
          if (handle) {
            dragModeRef.current = handle;
            dragStartRef.current = pos;
            dragBubbleStartRef.current = {
              x: selB.x,
              y: selB.y,
              w: selB.width,
              h: selB.height,
            };
            return;
          }
        }
      }

      const selCid = selectedCharIdRef.current;
      if (selCid) {
        const selCh = p.characters.find((c) => c.id === selCid);
        if (selCh && selCh.imageEl && !selCh.locked) {
          const cw = selCh.imageEl.naturalWidth * selCh.scale;
          const ch2 = selCh.imageEl.naturalHeight * selCh.scale;
          const cx = selCh.x - cw / 2;
          const cy = selCh.y - ch2 / 2;
          const hs = 12;
          const charHandles: { mode: DragMode; hx: number; hy: number }[] = [
            { mode: "resize-char-tl", hx: cx, hy: cy },
            { mode: "resize-char-tr", hx: cx + cw, hy: cy },
            { mode: "resize-char-bl", hx: cx, hy: cy + ch2 },
            { mode: "resize-char-br", hx: cx + cw, hy: cy + ch2 },
          ];
          for (const handle of charHandles) {
            if (
              Math.abs(pos.x - handle.hx) < hs &&
              Math.abs(pos.y - handle.hy) < hs
            ) {
              dragModeRef.current = handle.mode;
              dragStartRef.current = pos;
              dragCharStartRef.current = {
                x: selCh.x,
                y: selCh.y,
                scale: selCh.scale,
              };
              return;
            }
          }
          const rx = selCh.x;
          const ry = cy - 18;
          if (Math.hypot(pos.x - rx, pos.y - ry) <= 10) {
            dragModeRef.current = "rotate-char";
            dragStartRef.current = pos;
            dragCharStartRef.current = {
              x: selCh.x,
              y: selCh.y,
              scale: selCh.scale,
              rotation: selCh.rotation || 0,
              angleStart: Math.atan2(pos.y - selCh.y, pos.x - selCh.x),
            } as any;
            return;
          }
        }
      }

      {
        const drawables: Array<
          | { type: "char"; z: number; ch: CharacterPlacement }
          | { type: "bubble"; z: number; b: SpeechBubble }
        > = [
            ...p.characters.map((ch) => ({ type: "char" as const, z: ch.zIndex ?? 0, ch })),
            ...p.bubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
          ];
        drawables.sort((a, b) => a.z - b.z);
        for (let i = drawables.length - 1; i >= 0; i--) {
          const d = drawables[i];
          if (d.type === "bubble") {
            const b = d.b;
            if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
              onSelectBubble(b.id);
              onSelectChar(null);
              selectedBubbleIdRef.current = b.id;
              selectedCharIdRef.current = null;
              dragModeRef.current = "move";
              dragStartRef.current = pos;
              dragBubbleStartRef.current = { x: b.x, y: b.y, w: b.width, h: b.height };
              return;
            }
          } else {
            const ch = d.ch;
            if (!ch.imageEl) continue;
            const w = ch.imageEl.naturalWidth * ch.scale;
            const h = ch.imageEl.naturalHeight * ch.scale;
            if (
              pos.x >= ch.x - w / 2 &&
              pos.x <= ch.x + w / 2 &&
              pos.y >= ch.y - h / 2 &&
              pos.y <= ch.y + h / 2
            ) {
              onSelectChar(ch.id);
              onSelectBubble(null);
              selectedCharIdRef.current = ch.id;
              selectedBubbleIdRef.current = null;
              dragModeRef.current = "move-char";
              dragStartRef.current = pos;
              dragCharStartRef.current = { x: ch.x, y: ch.y, scale: ch.scale };
              return;
            }
          }
        }
      }

      const scriptCtx = canvas.getContext("2d");
      if (scriptCtx) {
        for (const scriptType of ["top", "bottom"] as const) {
          const sd = scriptType === "top" ? p.topScript : p.bottomScript;
          if (sd && sd.text) {
            const rect = getScriptRect(
              scriptCtx,
              sd,
              scriptType,
              CANVAS_W,
              CANVAS_H,
            );
            const handleSize = 10;
            const hx = rect.bx + rect.bw - 6;
            const hy = rect.by + rect.bh - 6;
            const nearHandle =
              Math.abs(pos.x - hx) <= handleSize && Math.abs(pos.y - hy) <= handleSize;
            if (nearHandle) {
              dragModeRef.current =
                scriptType === "top" ? "resize-script-top" : "resize-script-bottom";
              dragStartRef.current = pos;
              dragScriptFontStartRef.current = sd.fontSize || 20;
              onSelectBubble(null);
              onSelectChar(null);
              selectedBubbleIdRef.current = null;
              selectedCharIdRef.current = null;
              return;
            } else {
              if (
                pos.x >= rect.bx &&
                pos.x <= rect.bx + rect.bw &&
                pos.y >= rect.by &&
                pos.y <= rect.by + rect.bh
              ) {
                dragModeRef.current =
                  scriptType === "top" ? "move-script-top" : "move-script-bottom";
                dragStartRef.current = pos;
                dragScriptStartRef.current = { x: rect.bx, y: rect.by };
                onSelectBubble(null);
                onSelectChar(null);
                selectedBubbleIdRef.current = null;
                selectedCharIdRef.current = null;
                return;
              }
            }
          }
        }
      }

      onSelectBubble(null);
      onSelectChar(null);
      selectedBubbleIdRef.current = null;
      selectedCharIdRef.current = null;
    },
    [getCanvasPos, getHandleAtPos, onSelectBubble, onSelectChar],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      const mode = dragModeRef.current;

      if (!mode) {
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = "default";
        const p = panelRef.current;

        const scid = selectedCharIdRef.current;
        if (scid) {
          const sch = p.characters.find((c) => c.id === scid);
          if (sch && sch.imageEl) {
            const cw = sch.imageEl.naturalWidth * sch.scale;
            const ch2 = sch.imageEl.naturalHeight * sch.scale;
            const cx = sch.x - cw / 2;
            const cy = sch.y - ch2 / 2;
            const hs = 12;
            const charCorners = [
              { hx: cx, hy: cy, cur: "nwse-resize" },
              { hx: cx + cw, hy: cy, cur: "nesw-resize" },
              { hx: cx, hy: cy + ch2, cur: "nesw-resize" },
              { hx: cx + cw, hy: cy + ch2, cur: "nwse-resize" },
            ];
            for (const hc of charCorners) {
              if (
                Math.abs(pos.x - hc.hx) < hs &&
                Math.abs(pos.y - hc.hy) < hs
              ) {
                if (canvas) canvas.style.cursor = hc.cur;
                return;
              }
            }
          }
        }

        {
          const drawables: Array<
            | { type: "char"; z: number; ch: CharacterPlacement }
            | { type: "bubble"; z: number; b: SpeechBubble }
          > = [
              ...p.characters.map((ch) => ({ type: "char" as const, z: ch.zIndex ?? 0, ch })),
              ...p.bubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
            ];
          drawables.sort((a, b) => a.z - b.z);
          for (let i = drawables.length - 1; i >= 0; i--) {
            const d = drawables[i];
            if (d.type === "bubble") {
              const b = d.b;
              if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
                if (canvas) canvas.style.cursor = "move";
                return;
              }
            } else {
              const ch = d.ch;
              if (!ch.imageEl) continue;
              const w = ch.imageEl.naturalWidth * ch.scale;
              const h = ch.imageEl.naturalHeight * ch.scale;
              if (
                pos.x >= ch.x - w / 2 &&
                pos.x <= ch.x + w / 2 &&
                pos.y >= ch.y - h / 2 &&
                pos.y <= ch.y + h / 2
              ) {
                if (canvas) canvas.style.cursor = "move";
                return;
              }
            }
          }
        }

        {
          const cvs = canvasRef.current;
          if (cvs) {
            const sCtx = cvs.getContext("2d");
            if (sCtx) {
              for (const scriptType of ["top", "bottom"] as const) {
                const sd = scriptType === "top" ? p.topScript : p.bottomScript;
                if (sd && sd.text) {
                  const rect = getScriptRect(
                    sCtx,
                    sd,
                    scriptType,
                    CANVAS_W,
                    CANVAS_H,
                  );
                  const handleSize = 10;
                  const hx = rect.bx + rect.bw - 6;
                  const hy = rect.by + rect.bh - 6;
                  if (
                    Math.abs(pos.x - hx) <= handleSize &&
                    Math.abs(pos.y - hy) <= handleSize
                  ) {
                    cvs.style.cursor = "nwse-resize";
                    return;
                  }
                  if (
                    pos.x >= rect.bx &&
                    pos.x <= rect.bx + rect.bw &&
                    pos.y >= rect.by &&
                    pos.y <= rect.by + rect.bh
                  ) {
                    cvs.style.cursor = "move";
                    return;
                  }
                }
              }
            }
          }
        }
        return;
      }

      const dx = pos.x - dragStartRef.current.x;
      const dy = pos.y - dragStartRef.current.y;

      if (mode === "move-script-top" || mode === "move-script-bottom") {
        const p = panelRef.current;
        const sd = mode === "move-script-top" ? p.topScript : p.bottomScript;
        if (sd) {
          const newX = dragScriptStartRef.current.x + dx;
          const newY = dragScriptStartRef.current.y + dy;
          const key = mode === "move-script-top" ? "topScript" : "bottomScript";
          onUpdate({ ...p, [key]: { ...sd, x: newX, y: newY } });
        }
        return;
      }

      if (mode === "resize-script-top" || mode === "resize-script-bottom") {
        const p = panelRef.current;
        const sd = mode === "resize-script-top" ? p.topScript : p.bottomScript;
        if (sd) {
          const base = dragScriptFontStartRef.current;
          const next = Math.max(8, Math.min(36, Math.round(base + dy / 2)));
          const key = mode === "resize-script-top" ? "topScript" : "bottomScript";
          onUpdate({ ...p, [key]: { ...sd, fontSize: next } });
        }
        return;
      }

      if (mode === "move-char") {
        const cid = selectedCharIdRef.current;
        if (cid) {
          updateCharInPanel(cid, {
            x: dragCharStartRef.current.x + dx,
            y: dragCharStartRef.current.y + dy,
          });
        }
        return;
      }

      if (mode === "rotate-char") {
        const cid = selectedCharIdRef.current;
        if (cid) {
          const p = panelRef.current;
          const ch = p.characters.find((c) => c.id === cid);
          if (ch) {
            const currentAngle = Math.atan2(pos.y - ch.y, pos.x - ch.x);
            const startAngle = (dragCharStartRef.current as any).angleStart ?? 0;
            const baseRotation = (dragCharStartRef.current as any).rotation ?? (ch.rotation || 0);
            const nextRotation = baseRotation + (currentAngle - startAngle);
            updateCharInPanel(cid, { rotation: nextRotation });
          }
        }
        return;
      }

      if (mode?.startsWith("resize-char")) {
        const cid = selectedCharIdRef.current;
        if (cid) {
          const p = panelRef.current;
          const ch = p.characters.find((c) => c.id === cid);
          if (ch && ch.imageEl) {
            const origW =
              ch.imageEl.naturalWidth * dragCharStartRef.current.scale;
            const origH =
              ch.imageEl.naturalHeight * dragCharStartRef.current.scale;
            let newW = origW;
            let newH = origH;
            if (mode === "resize-char-br") {
              newW = origW + dx;
              newH = origH + dy;
            } else if (mode === "resize-char-bl") {
              newW = origW - dx;
              newH = origH + dy;
            } else if (mode === "resize-char-tr") {
              newW = origW + dx;
              newH = origH - dy;
            } else if (mode === "resize-char-tl") {
              newW = origW - dx;
              newH = origH - dy;
            }
            const avgRatio = (newW / origW + newH / origH) / 2;
            const newScale = Math.max(
              0.05,
              Math.min(5, dragCharStartRef.current.scale * avgRatio),
            );
            updateCharInPanel(cid, { scale: newScale });
          }
        }
        return;
      }

      const sid = selectedBubbleIdRef.current;
      if (!sid) return;
      const bs = dragBubbleStartRef.current;
      const minSize = 40;

      if (mode === "tail-ctrl1") {
        updateBubbleInPanel(sid, { tailCtrl1X: pos.x, tailCtrl1Y: pos.y });
      } else if (mode === "tail-ctrl2") {
        updateBubbleInPanel(sid, { tailCtrl2X: pos.x, tailCtrl2Y: pos.y });
      } else if (mode === "move-tail") {
        updateBubbleInPanel(sid, { tailTipX: pos.x, tailTipY: pos.y });
      } else if (mode === "move") {
        updateBubbleInPanel(sid, { x: bs.x + dx, y: bs.y + dy });
      } else if (mode === "resize-br") {
        updateBubbleInPanel(sid, {
          width: Math.max(minSize, bs.w + dx),
          height: Math.max(minSize, bs.h + dy),
        });
      } else if (mode === "resize-bl") {
        const newW = Math.max(minSize, bs.w - dx);
        updateBubbleInPanel(sid, {
          x: bs.x + bs.w - newW,
          width: newW,
          height: Math.max(minSize, bs.h + dy),
        });
      } else if (mode === "resize-tr") {
        const newH = Math.max(minSize, bs.h - dy);
        updateBubbleInPanel(sid, {
          y: bs.y + bs.h - newH,
          width: Math.max(minSize, bs.w + dx),
          height: newH,
        });
      } else if (mode === "resize-tl") {
        const newW = Math.max(minSize, bs.w - dx);
        const newH = Math.max(minSize, bs.h - dy);
        updateBubbleInPanel(sid, {
          x: bs.x + bs.w - newW,
          y: bs.y + bs.h - newH,
          width: newW,
          height: newH,
        });
      } else if (mode === "resize-r") {
        updateBubbleInPanel(sid, { width: Math.max(minSize, bs.w + dx) });
      } else if (mode === "resize-l") {
        const newW = Math.max(minSize, bs.w - dx);
        updateBubbleInPanel(sid, { x: bs.x + bs.w - newW, width: newW });
      } else if (mode === "resize-b") {
        updateBubbleInPanel(sid, { height: Math.max(minSize, bs.h + dy) });
      } else if (mode === "resize-t") {
        const newH = Math.max(minSize, bs.h - dy);
        updateBubbleInPanel(sid, { y: bs.y + bs.h - newH, height: newH });
      }
    },
    [getCanvasPos, updateBubbleInPanel, updateCharInPanel],
  );

  const handlePointerUp = useCallback(() => {
    dragModeRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      const p = panelRef.current;
      for (let i = p.bubbles.length - 1; i >= 0; i--) {
        const b = p.bubbles[i];
        if (
          pos.x >= b.x &&
          pos.x <= b.x + b.width &&
          pos.y >= b.y &&
          pos.y <= b.y + b.height
        ) {
          onSelectBubble(b.id);
          // Focus sidebar textarea instead of inline
          if (onEditBubble) {
            setTimeout(() => onEditBubble(), 50);
          } else {
            setEditingBubbleId(b.id);
          }
          return;
        }
      }
    },
    [getCanvasPos, onSelectBubble, onEditBubble],
  );

  const hasZoom = zoom !== undefined;
  const zoomScale = (zoom ?? 100) / 100;
  const hasSelection = !!selectedBubbleIdRef.current || !!selectedCharIdRef.current;

  const handleDeleteSelection = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const newBubbles = p.bubbles.filter((b) => b.id !== sid);
      onUpdate({ ...p, bubbles: newBubbles });
      onSelectBubble(null);
      selectedBubbleIdRef.current = null;
    } else if (cid) {
      const newChars = p.characters.filter((c) => c.id !== cid);
      onUpdate({ ...p, characters: newChars });
      onSelectChar(null);
      selectedCharIdRef.current = null;
    }
  }, [onUpdate, onSelectBubble, onSelectChar]);

  const handleDuplicateSelection = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const b = p.bubbles.find((x) => x.id === sid);
      if (!b) return;
      const maxZ = p.bubbles.reduce((m, cur) => Math.max(m, cur.zIndex ?? 0), 0);
      const duplicated: SpeechBubble = {
        ...b,
        id: generateId(),
        x: b.x + 24,
        y: b.y + 24,
        zIndex: maxZ + 1,
      };
      onUpdate({ ...p, bubbles: [...p.bubbles, duplicated] });
      onSelectBubble(duplicated.id);
      onSelectChar(null);
      selectedBubbleIdRef.current = duplicated.id;
      selectedCharIdRef.current = null;
    } else if (cid) {
      const ch = p.characters.find((x) => x.id === cid);
      if (!ch) return;
      const maxZ = p.characters.reduce((m, cur) => Math.max(m, cur.zIndex ?? 0), 0);
      const duplicated: CharacterPlacement = {
        ...ch,
        id: generateId(),
        x: ch.x + 24,
        y: ch.y + 24,
        zIndex: maxZ + 1,
      };
      onUpdate({ ...p, characters: [...p.characters, duplicated] });
      onSelectChar(duplicated.id);
      onSelectBubble(null);
      selectedCharIdRef.current = duplicated.id;
      selectedBubbleIdRef.current = null;
    }
  }, [onUpdate, onSelectBubble, onSelectChar]);

  const handleBringToFront = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const maxZ = p.bubbles.reduce((m, cur) => Math.max(m, cur.zIndex ?? 0), 0);
      updateBubbleInPanel(sid, { zIndex: maxZ + 1 });
    } else if (cid) {
      const maxZ = p.characters.reduce((m, cur) => Math.max(m, cur.zIndex ?? 0), 0);
      updateCharInPanel(cid, { zIndex: maxZ + 1 });
    }
  }, [updateBubbleInPanel, updateCharInPanel]);

  const handleSendToBack = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const minZ = p.bubbles.reduce((m, cur) => Math.min(m, cur.zIndex ?? 0), 0);
      updateBubbleInPanel(sid, { zIndex: minZ - 1 });
    } else if (cid) {
      const minZ = p.characters.reduce((m, cur) => Math.min(m, cur.zIndex ?? 0), 0);
      updateCharInPanel(cid, { zIndex: minZ - 1 });
    }
  }, [updateBubbleInPanel, updateCharInPanel]);

  const handleBringForward = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const list = p.bubbles.map((b) => ({ id: b.id, z: b.zIndex ?? 0 }));
      list.sort((a, b) => a.z - b.z);
      const idx = list.findIndex((x) => x.id === sid);
      if (idx >= 0 && idx < list.length - 1) {
        const current = list[idx];
        const next = list[idx + 1];
        updateBubbleInPanel(current.id, { zIndex: next.z });
        updateBubbleInPanel(next.id, { zIndex: current.z });
      }
    } else if (cid) {
      const list = p.characters.map((c) => ({ id: c.id, z: c.zIndex ?? 0 }));
      list.sort((a, b) => a.z - b.z);
      const idx = list.findIndex((x) => x.id === cid);
      if (idx >= 0 && idx < list.length - 1) {
        const current = list[idx];
        const next = list[idx + 1];
        updateCharInPanel(current.id, { zIndex: next.z });
        updateCharInPanel(next.id, { zIndex: current.z });
      }
    }
  }, [updateBubbleInPanel, updateCharInPanel]);

  const handleSendBackward = useCallback(() => {
    const p = panelRef.current;
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const list = p.bubbles.map((b) => ({ id: b.id, z: b.zIndex ?? 0 }));
      list.sort((a, b) => a.z - b.z);
      const idx = list.findIndex((x) => x.id === sid);
      if (idx > 0) {
        const current = list[idx];
        const prev = list[idx - 1];
        updateBubbleInPanel(current.id, { zIndex: prev.z });
        updateBubbleInPanel(prev.id, { zIndex: current.z });
      }
    } else if (cid) {
      const list = p.characters.map((c) => ({ id: c.id, z: c.zIndex ?? 0 }));
      list.sort((a, b) => a.z - b.z);
      const idx = list.findIndex((x) => x.id === cid);
      if (idx > 0) {
        const current = list[idx];
        const prev = list[idx - 1];
        updateCharInPanel(current.id, { zIndex: prev.z });
        updateCharInPanel(prev.id, { zIndex: current.z });
      }
    }
  }, [updateBubbleInPanel, updateCharInPanel]);

  const handleLock = useCallback(() => {
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const b = panelRef.current.bubbles.find((b) => b.id === sid);
      if (b) updateBubbleInPanel(sid, { locked: !b.locked });
    } else if (cid) {
      const c = panelRef.current.characters.find((c) => c.id === cid);
      if (c) updateCharInPanel(cid, { locked: !c.locked });
    }
  }, [updateBubbleInPanel, updateCharInPanel]);

  const handleRotateSelection = useCallback(() => {
    const cid = selectedCharIdRef.current;
    if (!cid) return;
    const p = panelRef.current;
    const c = p.characters.find((ch) => ch.id === cid);
    if (!c) return;
    const next = (c.rotation || 0) + Math.PI / 12;
    updateCharInPanel(cid, { rotation: next });
  }, [updateCharInPanel]);

  const handleCopy = useCallback(() => {
    const sid = selectedBubbleIdRef.current;
    const cid = selectedCharIdRef.current;
    if (sid) {
      const b = panelRef.current.bubbles.find((b) => b.id === sid);
      if (b) {
        localStorage.setItem("olli_clipboard", JSON.stringify({ type: "bubble", data: b }));
        toast({ title: "복사됨", description: "말풍선이 복사되었습니다." });
      }
    } else if (cid) {
      const c = panelRef.current.characters.find((c) => c.id === cid);
      if (c) {
        localStorage.setItem("olli_clipboard", JSON.stringify({ type: "char", data: c }));
        toast({ title: "복사됨", description: "캐릭터가 복사되었습니다." });
      }
    }
  }, [toast]);

  const handlePaste = useCallback(() => {
    try {
      const clip = localStorage.getItem("olli_clipboard");
      if (!clip) return;
      const parsed = JSON.parse(clip);
      if (parsed.type === "bubble") {
        const b = parsed.data as SpeechBubble;
        const newB: SpeechBubble = {
          ...b,
          id: generateId(),
          x: b.x + 20,
          y: b.y + 20,
          zIndex: (panelRef.current.bubbles.length > 0 ? Math.max(...panelRef.current.bubbles.map(x => x.zIndex || 0)) : 10) + 1,
        };
        onUpdate({
          ...panelRef.current,
          bubbles: [...panelRef.current.bubbles, newB],
        });
        onSelectBubble(newB.id);
        onSelectChar(null);
      } else if (parsed.type === "char") {
        const c = parsed.data as CharacterPlacement;
        const newC: CharacterPlacement = {
          ...c,
          id: generateId(),
          x: c.x + 20,
          y: c.y + 20,
          zIndex: (panelRef.current.characters.length > 0 ? Math.max(...panelRef.current.characters.map(x => x.zIndex || 0)) : 0) + 1,
        };
        onUpdate({
          ...panelRef.current,
          characters: [...panelRef.current.characters, newC],
        });
        onSelectChar(newC.id);
        onSelectBubble(null);
      }
      toast({ title: "붙여넣기 완료" });
    } catch (e) {
      console.error(e);
    }
  }, [onUpdate, onSelectBubble, onSelectChar, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (!selectedBubbleIdRef.current && !selectedCharIdRef.current) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelection();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        if (e.key === "]") {
          handleBringForward();
        } else {
          handleSendBackward();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDeleteSelection, handleBringForward, handleSendBackward]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={canvasWrapperRef}
          className="relative inline-block shrink-0"
          style={
            hasZoom
              ? {
                width: CANVAS_W * zoomScale,
                height: CANVAS_H * zoomScale,
                overflow: "visible",
              }
              : { overflow: "visible" }
          }
        >
          <canvas
            ref={(el) => {
              (canvasRef as any).current = el;
              externalCanvasRef?.(el);
            }}
            width={CANVAS_W}
            height={CANVAS_H}
            style={
              hasZoom
                ? {
                  width: "100%",
                  height: "100%",
                  display: "block",
                  touchAction: "none",
                }
                : {
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                  touchAction: "none",
                }
            }
            className="rounded-md border border-border"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            data-testid="panel-canvas"
          />

          {/* SVG handle overlay — rendered outside canvas so handles are visible beyond canvas bounds */}
          {(() => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            const wrapRect = canvasWrapperRef.current?.getBoundingClientRect();
            if (!wrapRect) return null;
            const scaleX = rect.width / CANVAS_W;
            const scaleY = rect.height / CANVAS_H;
            const offsetX = rect.left - wrapRect.left;
            const offsetY = rect.top - wrapRect.top;

            const toSvgX = (cx: number) => offsetX + cx * scaleX;
            const toSvgY = (cy: number) => offsetY + cy * scaleY;

            const selBubble = selectedBubbleId ? panel.bubbles.find(b => b.id === selectedBubbleId) : null;
            const selChar = selectedCharId ? panel.characters.find(c => c.id === selectedCharId) : null;

            const HANDLE_R = 5;
            const HANDLE_COLOR = "hsl(173,80%,45%)";

            const handles: { x: number; y: number; cursor: string; mode: string }[] = [];

            if (selBubble) {
              const b = selBubble;
              handles.push(
                { x: toSvgX(b.x - 4), y: toSvgY(b.y - 4), cursor: "nwse-resize", mode: "resize-tl" },
                { x: toSvgX(b.x + b.width / 2), y: toSvgY(b.y - 4), cursor: "ns-resize", mode: "resize-t" },
                { x: toSvgX(b.x + b.width + 4), y: toSvgY(b.y - 4), cursor: "nesw-resize", mode: "resize-tr" },
                { x: toSvgX(b.x + b.width + 4), y: toSvgY(b.y + b.height / 2), cursor: "ew-resize", mode: "resize-r" },
                { x: toSvgX(b.x + b.width + 4), y: toSvgY(b.y + b.height + 4), cursor: "nwse-resize", mode: "resize-br" },
                { x: toSvgX(b.x + b.width / 2), y: toSvgY(b.y + b.height + 4), cursor: "ns-resize", mode: "resize-b" },
                { x: toSvgX(b.x - 4), y: toSvgY(b.y + b.height + 4), cursor: "nesw-resize", mode: "resize-bl" },
                { x: toSvgX(b.x - 4), y: toSvgY(b.y + b.height / 2), cursor: "ew-resize", mode: "resize-l" },
              );
            }

            if (selChar && selChar.imageEl) {
              const cw = selChar.imageEl.naturalWidth * selChar.scale;
              const ch2 = selChar.imageEl.naturalHeight * selChar.scale;
              const cx = selChar.x - cw / 2;
              const cy = selChar.y - ch2 / 2;
              handles.push(
                { x: toSvgX(cx - 4), y: toSvgY(cy - 4), cursor: "nwse-resize", mode: "resize-char-tl" },
                { x: toSvgX(cx + cw + 4), y: toSvgY(cy - 4), cursor: "nesw-resize", mode: "resize-char-tr" },
                { x: toSvgX(cx - 4), y: toSvgY(cy + ch2 + 4), cursor: "nesw-resize", mode: "resize-char-bl" },
                { x: toSvgX(cx + cw + 4), y: toSvgY(cy + ch2 + 4), cursor: "nwse-resize", mode: "resize-char-br" },
              );
            }

            if (handles.length === 0) return null;

            return (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {/* Selection dashed box */}
                {selBubble && (() => {
                  const b = selBubble;
                  const x1 = toSvgX(b.x - 4), y1 = toSvgY(b.y - 4);
                  const x2 = toSvgX(b.x + b.width + 4), y2 = toSvgY(b.y + b.height + 4);
                  return <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={HANDLE_COLOR} strokeWidth="1.5" strokeDasharray="5,3" />;
                })()}
                {selChar && selChar.imageEl && (() => {
                  const cw = selChar.imageEl!.naturalWidth * selChar.scale;
                  const ch2 = selChar.imageEl!.naturalHeight * selChar.scale;
                  const x1 = toSvgX(selChar.x - cw / 2 - 4), y1 = toSvgY(selChar.y - ch2 / 2 - 4);
                  const x2 = toSvgX(selChar.x + cw / 2 + 4), y2 = toSvgY(selChar.y + ch2 / 2 + 4);
                  return <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={HANDLE_COLOR} strokeWidth="1.5" strokeDasharray="5,3" />;
                })()}
                {/* Handle circles */}
                {handles.map((h, i) => (
                  <circle
                    key={i}
                    cx={h.x}
                    cy={h.y}
                    r={HANDLE_R}
                    fill="white"
                    stroke={HANDLE_COLOR}
                    strokeWidth="1.8"
                    style={{ pointerEvents: "none", cursor: h.cursor }}
                  />
                ))}
              </svg>
            );
          })()}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={handleCopy}>복사</ContextMenuItem>
        <ContextMenuItem onSelect={handlePaste}>붙여넣기</ContextMenuItem>
        <ContextMenuItem onSelect={handleDuplicateSelection}>복제</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleBringForward}>레이어 앞으로</ContextMenuItem>
        <ContextMenuItem onSelect={handleSendBackward}>레이어 뒤로</ContextMenuItem>
        <ContextMenuItem onSelect={handleBringToFront}>맨 앞으로 가져오기</ContextMenuItem>
        <ContextMenuItem onSelect={handleSendToBack}>맨 뒤로 보내기</ContextMenuItem>
        <ContextMenuItem onSelect={handleRotateSelection}>회전</ContextMenuItem>
        <ContextMenuItem onSelect={handleLock}>
          {selectedBubbleId && panel.bubbles.find(b => b.id === selectedBubbleId)?.locked ? "잠금 해제" :
            selectedCharId && panel.characters.find(c => c.id === selectedCharId)?.locked ? "잠금 해제" : "잠금"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onSelect={handleDeleteSelection}>
          삭제
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function EditorPanel({
  panel,
  index,
  total,
  onUpdate,
  onRemove,
  galleryImages,
  galleryLoading,
  selectedBubbleId,
  setSelectedBubbleId,
  selectedCharId,
  setSelectedCharId,
  creatorTier,
  isPro,
  mode = "image",
  bubbleTextareaRef,
}: {
  panel: PanelData;
  index: number;
  total: number;
  onUpdate: (updated: PanelData) => void;
  onRemove: () => void;
  galleryImages: Generation[];
  galleryLoading: boolean;
  selectedBubbleId: string | null;
  setSelectedBubbleId: (id: string | null) => void;
  selectedCharId: string | null;
  setSelectedCharId: (id: string | null) => void;
  creatorTier: number;
  isPro: boolean;
  mode?: "image" | "bubble" | "template";
  bubbleTextareaRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [showBubbleTemplatePicker, setShowBubbleTemplatePicker] = useState(false);
  const [templateCatIdx, setTemplateCatIdx] = useState(0);
  const [removingBg, setRemovingBg] = useState(false);
  const { toast } = useToast();

  const canBubbleEdit = true;
  const canAllFonts = isPro || creatorTier >= 3;
  const availableFonts = canAllFonts ? KOREAN_FONTS : KOREAN_FONTS.slice(0, 3);

  const selectedBubble =
    panel.bubbles.find((b) => b.id === selectedBubbleId) || null;
  const selectedChar =
    panel.characters.find((c) => c.id === selectedCharId) || null;

  const getDailyKey = (feature: string) => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `daily_${feature}_${y}${m}${day}`;
  };
  const getDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const raw = localStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  };
  const incDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const n = getDailyCount(feature) + 1;
    localStorage.setItem(key, String(n));
  };

  const updateBubble = (id: string, updates: Partial<SpeechBubble>) => {
    onUpdate({
      ...panel,
      bubbles: panel.bubbles.map((b) =>
        b.id === id ? { ...b, ...updates } : b,
      ),
    });
  };

  const handleFlipTailHorizontally = () => {
    if (!selectedBubble) return;
    const b = selectedBubble;
    if (b.tailStyle === "none") return;

    const cx = b.x + b.width / 2;
    const defaultTip = getDefaultTailTip(b);
    const origTipX = b.tailTipX ?? defaultTip?.x ?? cx;
    const origTipY = b.tailTipY ?? defaultTip?.y ?? (b.y + b.height);

    const updates: Partial<SpeechBubble> = {
      tailTipX: 2 * cx - origTipX,
      tailTipY: origTipY,
    };

    if (typeof b.tailCtrl1X === "number" && typeof b.tailCtrl1Y === "number") {
      updates.tailCtrl1X = 2 * cx - b.tailCtrl1X;
      updates.tailCtrl1Y = b.tailCtrl1Y;
    }
    if (typeof b.tailCtrl2X === "number" && typeof b.tailCtrl2Y === "number") {
      updates.tailCtrl2X = 2 * cx - b.tailCtrl2X;
      updates.tailCtrl2Y = b.tailCtrl2Y;
    }

    updateBubble(b.id, updates);
  };

  const addBubble = () => {
    if (!canBubbleEdit) return;
    if (panel.bubbles.length >= 5) return;
    const newB = createBubble(CANVAS_W, CANVAS_H);
    onUpdate({ ...panel, bubbles: [...panel.bubbles, newB] });
    setSelectedBubbleId(newB.id);
    setSelectedCharId(null);
  };

  const deleteBubble = (id: string) => {
    onUpdate({ ...panel, bubbles: panel.bubbles.filter((b) => b.id !== id) });
    if (selectedBubbleId === id) setSelectedBubbleId(null);
  };

  const addBubbleTemplate = (templatePath: string) => {
    if (!canBubbleEdit) return;
    if (panel.bubbles.length >= 5) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = Math.min(CANVAS_W, CANVAS_H) * 0.4;
      const aspect = img.width / img.height;
      let w: number, h: number;
      if (aspect > 1) { w = maxDim; h = maxDim / aspect; }
      else { h = maxDim; w = maxDim * aspect; }
      const newB: SpeechBubble = {
        id: generateId(),
        seed: Math.floor(Math.random() * 100000),
        x: CANVAS_W / 2 - w / 2,
        y: CANVAS_H / 2 - h / 2,
        width: w,
        height: h,
        text: "",
        style: "image",
        tailStyle: "none",
        tailDirection: "bottom",
        strokeWidth: 2,
        wobble: 5,
        fontSize: 15,
        fontKey: "default",
        templateSrc: templatePath,
        templateImg: img,
      };
      onUpdate({ ...panel, bubbles: [...panel.bubbles, newB] });
      setSelectedBubbleId(newB.id);
      setSelectedCharId(null);
      setShowBubbleTemplatePicker(false);
      toast({ title: "말풍선 추가됨" });
    };
    img.onerror = () => toast({ title: "템플릿 로드 실패", variant: "destructive" });
    img.src = templatePath;
  };

  const addCharacter = (gen: Generation) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = 150;
      const s = Math.min(
        maxDim / img.naturalWidth,
        maxDim / img.naturalHeight,
        1,
      );
      const newChar: CharacterPlacement = {
        id: generateId(),
        imageUrl: gen.resultImageUrl,
        x: CANVAS_W / 2,
        y: CANVAS_H / 2,
        scale: s,
        imageEl: img,
        zIndex: 0,
      };
      onUpdate({ ...panel, characters: [...panel.characters, newChar] });
      setSelectedCharId(newChar.id);
      setSelectedBubbleId(null);
      setShowCharPicker(false);
    };
    img.src = gen.resultImageUrl;
  };

  const removeCharacter = (id: string) => {
    onUpdate({
      ...panel,
      characters: panel.characters.filter((c) => c.id !== id),
    });
    if (selectedCharId === id) setSelectedCharId(null);
  };

  const charImages = galleryImages;

  const layerItems = useMemo(() => {
    const items: Array<
      | { type: "char"; id: string; z: number; label: string; thumb?: string }
      | { type: "bubble"; id: string; z: number; label: string; thumb?: string }
    > = [
        ...panel.characters.map((c) => ({
          type: "char" as const,
          id: c.id,
          z: c.zIndex ?? 0,
          label: "캐릭터",
          thumb: c.imageUrl,
        })),
        ...panel.bubbles.map((b, i) => ({
          type: "bubble" as const,
          id: b.id,
          z: b.zIndex ?? 10,
          label: b.text || STYLE_LABELS[b.style] || `말풍선 ${i + 1}`,
          thumb: b.style === "image" && (b as any).templateSrc ? (b as any).templateSrc : undefined,
        })),
      ];
    return items.sort((a, b) => b.z - a.z);
  }, [panel.characters, panel.bubbles]);

  const moveLayer = (index: number, direction: "up" | "down") => {
    const items = layerItems;
    if (direction === "up" && index <= 0) return;
    if (direction === "down" && index >= items.length - 1) return;
    const aIdx = index;
    const bIdx = direction === "up" ? index - 1 : index + 1;
    const a = items[aIdx];
    const b = items[bIdx];
    const newAz = b.z;
    const newBz = a.z;
    if (a.type === "char") {
      onUpdate({
        ...panel,
        characters: panel.characters.map((c) => (c.id === a.id ? { ...c, zIndex: newAz } : c)),
      });
    } else {
      onUpdate({
        ...panel,
        bubbles: panel.bubbles.map((bb) => (bb.id === a.id ? { ...bb, zIndex: newAz } : bb)),
      });
    }
    if (b.type === "char") {
      onUpdate({
        ...panel,
        characters: panel.characters.map((c) => (c.id === b.id ? { ...c, zIndex: newBz } : c)),
      });
    } else {
      onUpdate({
        ...panel,
        bubbles: panel.bubbles.map((bb) => (bb.id === b.id ? { ...bb, zIndex: newBz } : bb)),
      });
    }
  };

  const [dragLayerIdx, setDragLayerIdx] = useState<number | null>(null);
  const applyLayerOrder = useCallback((ordered: Array<{ type: "char" | "bubble"; id: string }>) => {
    onUpdate({
      ...panel,
      characters: panel.characters.map((c) => {
        const idx = ordered.findIndex((it) => it.type === "char" && it.id === c.id);
        return idx >= 0 ? { ...c, zIndex: idx } : c;
      }),
      bubbles: panel.bubbles.map((b) => {
        const idx = ordered.findIndex((it) => it.type === "bubble" && it.id === b.id);
        return idx >= 0 ? { ...b, zIndex: idx } : b;
      }),
    });
  }, [panel, onUpdate]);

  const isImageMode = mode === "image";
  const isBubbleMode = mode === "bubble";
  const isTemplateMode = mode === "template";

  const handleRemoveBackground = async () => {
    if (!selectedChar) return;
    if (!isPro) {
      toast({
        title: "Pro 전용 기능",
        description: "배경제거는 Pro 멤버십 전용 기능입니다.",
        variant: "destructive",
      });
      return;
    }
    try {
      setRemovingBg(true);
      const res = await apiRequest("POST", "/api/remove-background", {
        sourceImageData: selectedChar.imageUrl,
      });
      const data = await res.json();
      const imageUrl = data.imageUrl as string;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const updatedChars = panel.characters.map((c) =>
          c.id === selectedChar.id ? { ...c, imageUrl, imageEl: img } : c,
        );
        onUpdate({ ...panel, characters: updatedChars });
        toast({ title: "배경 제거 완료" });
      };
      img.src = imageUrl;
    } catch (error: any) {
      toast({
        title: "배경 제거 실패",
        description: error?.message || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setRemovingBg(false);
    }
  };

  const handleLocalImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result;
        if (typeof src !== "string") return;
        const img = new Image();
        img.onload = () => {
          const maxDim = 150;
          const s = Math.min(
            maxDim / img.naturalWidth,
            maxDim / img.naturalHeight,
            1,
          );
          const newChar: CharacterPlacement = {
            id: generateId(),
            imageUrl: src,
            x: CANVAS_W / 2,
            y: CANVAS_H / 2,
            scale: s,
            imageEl: img,
            zIndex: 0,
          };
          onUpdate({
            ...panel,
            characters: [...panel.characters, newChar],
          });
          setSelectedCharId(newChar.id);
          setSelectedBubbleId(null);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
    setShowCharPicker(false);
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onUpdate({ ...panel, backgroundImageUrl: src, backgroundImageEl: img });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundFromGallery = (gen: Generation) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      onUpdate({ ...panel, backgroundImageUrl: gen.resultImageUrl, backgroundImageEl: img });
    };
    img.src = gen.resultImageUrl;
  };

  return (
    <div className="space-y-5" data-testid={`panel-editor-${index}`}>
      <div className="flex gap-1 flex-wrap">
        {isBubbleMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={addBubble}
            disabled={!canBubbleEdit || panel.bubbles.length >= 5}
            data-testid={`button-add-bubble-${index}`}
            title={
              !canBubbleEdit ? "신인 작가 등급(5회+)부터 사용 가능" : undefined
            }
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            말풍선{!canBubbleEdit && " (잠김)"}
          </Button>
        )}
        {isTemplateMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBubbleTemplatePicker(true)}
            disabled={!canBubbleEdit || panel.bubbles.length >= 5}
            data-testid={`button-bubble-templates-${index}`}
          >
            <Layers className="h-3.5 w-3.5 mr-1" />
            템플릿 가져오기
          </Button>
        )}
        {isImageMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCharPicker(!showCharPicker)}
            data-testid={`button-add-character-${index}`}
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            이미지 선택
          </Button>
        )}
      </div>

      {isImageMode && showCharPicker && (
        <div className="rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">이미지 선택 / 업로드</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCharPicker(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">이미지 업로드 (여러 장 가능)</Label>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover-elevate"
              onClick={() =>
                document.getElementById(`story-image-upload-${index}`)?.click()
              }
              data-testid={`button-upload-characters-${index}`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>이미지 파일을 선택해서 추가</span>
            </button>
            <input
              id={`story-image-upload-${index}`}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLocalImageFiles(e.target.files)}
            />
          </div>

          {galleryLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : charImages.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-4 text-center"
              data-testid="text-no-characters"
            >
              생성된 이미지가 없습니다. 먼저 캐릭터나 배경을 만들어주세요.
            </p>
          ) : (
            <div
              className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto"
              data-testid="character-picker-grid"
            >
              {charImages.map((gen) => (
                <button
                  key={gen.id}
                  className="aspect-square rounded-md overflow-hidden border border-border hover-elevate cursor-pointer"
                  onClick={() => addCharacter(gen)}
                  data-testid={`button-pick-character-${gen.id}`}
                >
                  <img
                    src={gen.resultImageUrl}
                    alt={gen.prompt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character placement note - images are added as moveable characters */}
      {isImageMode && !showCharPicker && panel.characters.length === 0 && (
        <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground text-center">
          <ImageIcon className="h-4 w-4 mx-auto mb-1 opacity-50" />
          이미지를 추가하면 캔버스에서<br/>이동·크기·회전 편집이 가능합니다
        </div>
      )}

      {isImageMode && selectedChar && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 mt-3">
            <span className="text-[13px] font-medium text-muted-foreground">
              이미지 도구
            </span>
            {!isPro && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Pro
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            className="w-full justify-center gap-1.5"
            onClick={handleRemoveBackground}
            disabled={removingBg || !isPro}
            data-testid={`button-remove-bg-story-${index}`}
          >
            {removingBg ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">AI 배경제거 (Pro)</span>
          </Button>
        </div>
      )}

      {(panel.characters.length > 0 || panel.bubbles.length > 0) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px] font-medium text-muted-foreground">
              레이어 목록 ({layerItems.length})
            </span>
          </div>
          {layerItems.map((item, i) => (
            <div
              key={`${item.type}:${item.id}`}
              className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${item.type === "char"
                ? selectedCharId === item.id
                  ? "bg-primary/10"
                  : "hover-elevate"
                : selectedBubbleId === item.id
                  ? "bg-primary/10"
                  : "hover-elevate"
                }`}
              onClick={() => {
                if (item.type === "char") {
                  setSelectedCharId(item.id);
                  setSelectedBubbleId(null);
                } else {
                  setSelectedBubbleId(item.id);
                  setSelectedCharId(null);
                }
              }}
              draggable
              onDragStart={() => setDragLayerIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragLayerIdx === null || dragLayerIdx === i) return;
                const base = layerItems.map((li) => ({ type: li.type, id: li.id }));
                const moved = base[dragLayerIdx];
                const rest = base.filter((_, idx) => idx !== dragLayerIdx);
                const newOrder = [...rest.slice(0, i), moved, ...rest.slice(i)];
                applyLayerOrder(newOrder);
                setDragLayerIdx(null);
              }}
              data-testid={`row-layer-${i}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded overflow-hidden shrink-0 border border-border bg-muted">
                  {item.thumb ? (
                    <img src={item.thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px]">
                      {item.type === "bubble" ? "B" : "C"}
                    </div>
                  )}
                </div>
                <span className="text-xs truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(i, "up");
                  }}
                  title="앞으로"
                  data-testid={`button-moveup-layer-${i}`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={i === layerItems.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(i, "down");
                  }}
                  title="뒤로"
                  data-testid={`button-movedown-layer-${i}`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.type === "char") {
                      removeCharacter(item.id);
                    } else {
                      deleteBubble(item.id);
                    }
                  }}
                  data-testid={`button-delete-layer-${i}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isBubbleMode || isTemplateMode) && selectedBubble && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold">말풍선 설정</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteBubble(selectedBubble.id)}
              className="text-destructive"
              data-testid="button-delete-selected-bubble"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              삭제
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                updateBubble(selectedBubble.id, {
                  zIndex: (selectedBubble.zIndex ?? 10) + 1,
                })
              }
            >
              앞으로
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                updateBubble(selectedBubble.id, {
                  zIndex: (selectedBubble.zIndex ?? 10) - 1,
                })
              }
            >
              뒤로
            </Button>
          </div>

          <div>
            <Label className="text-[13px] mb-1 block">텍스트</Label>
            <Textarea
              ref={(el) => { if (bubbleTextareaRef) bubbleTextareaRef.current = el; }}
              value={selectedBubble.text}
              onChange={(e) =>
                updateBubble(selectedBubble.id, { text: e.target.value })
              }
              placeholder="말풍선 내용..."
              rows={2}
              className="text-sm"
              data-testid="input-selected-bubble-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[13px] mb-1 block">글씨체</Label>
              <Select
                value={selectedBubble.fontKey}
                onValueChange={(v) =>
                  updateBubble(selectedBubble.id, { fontKey: v })
                }
              >
                <SelectTrigger data-testid="select-bubble-font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {availableFonts.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.family }}>{f.label}</span>
                    </SelectItem>
                  ))}
                  {!canAllFonts && (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                      Pro 멤버십 또는 프로 연재러(30회+) 등급에서 전체 폰트 해금
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-[13px] mb-1.5 block">말풍선 형태</Label>
              {/* 기본 스타일 */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                {Object.entries(STYLE_LABELS).filter(([k]) => k !== "image").map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => updateBubble(selectedBubble.id, { style: k as BubbleStyle, seed: Math.floor(Math.random() * 1000000) })}
                    className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${selectedBubble.style === k ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"}`}
                    data-testid={`btn-style-${k}`}
                  >{l}</button>
                ))}
              </div>
              {/* 특수 효과 스타일 */}
              <p className="text-[10px] text-muted-foreground mb-1">✨ 특수 효과</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(FLASH_STYLE_LABELS).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => updateBubble(selectedBubble.id, { style: k as BubbleStyle, seed: Math.floor(Math.random() * 1000000) })}
                    className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${selectedBubble.style === k ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"}`}
                    data-testid={`btn-style-${k}`}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 스타일별 고급 파라미터 ── */}

          {/* Wobble: handwritten / wobbly / wavy */}
          {(["handwritten", "wobbly", "wavy"] as BubbleStyle[]).includes(selectedBubble.style) && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">흔들림 {selectedBubble.wobble ?? 5}</span>
              <Slider value={[selectedBubble.wobble ?? 5]} onValueChange={([v]) => updateBubble(selectedBubble.id, { wobble: v })} min={0} max={20} step={0.5} className="flex-1" />
            </div>
          )}

          {/* Polygon */}
          {selectedBubble.style === "polygon" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">다각형 설정</p>
              {([
                { label: "변 수", key: "shapeSides", min: 3, max: 12, step: 1, def: 6 },
                { label: "모서리", key: "shapeCornerRadius", min: 0, max: 40, step: 1, def: 8 },
                { label: "흔들림", key: "shapeWobble", min: 0, max: 20, step: 0.5, def: 0 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(1) : val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Spiky */}
          {selectedBubble.style === "spiky" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">뾰족한 설정</p>
              {([
                { label: "가시 수", key: "shapeSpikeCount", min: 4, max: 30, step: 1, def: 12 },
                { label: "가시 길이", key: "shapeSpikeHeight", min: 5, max: 60, step: 1, def: 20 },
                { label: "날카로움", key: "shapeSpikeSharpness", min: 0.1, max: 1, step: 0.05, def: 0.7 },
                { label: "흔들림", key: "shapeWobble", min: 0, max: 20, step: 0.5, def: 0 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(2) : val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Cloud */}
          {selectedBubble.style === "cloud" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">구름 설정</p>
              {([
                { label: "구름 수", key: "shapeBumpCount", min: 4, max: 16, step: 1, def: 8 },
                { label: "크기", key: "shapeBumpSize", min: 5, max: 40, step: 1, def: 15 },
                { label: "둥글기", key: "shapeBumpRoundness", min: 0.1, max: 1.5, step: 0.05, def: 0.8 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(2) : val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Shout */}
          {selectedBubble.style === "shout" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">외침 설정</p>
              {([
                { label: "가시 수", key: "shapeSpikeCount", min: 4, max: 24, step: 1, def: 12 },
                { label: "가시 높이", key: "shapeWobble", min: 0.05, max: 0.6, step: 0.01, def: 0.25 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(2) : val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Flash / Eyelash 특수효과 파라미터 */}
          {(selectedBubble.style.startsWith("flash_")) && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">효과 설정</p>
              {(selectedBubble.style === "flash_eyelash" ? [
                { label: "바늘 수", key: "flashLineCount" as string, min: 20, max: 180, step: 1, def: 90 },
                { label: "바늘 길이", key: "flashLineLength" as string, min: 5, max: 80, step: 1, def: 28 },
                { label: "바늘 굵기", key: "flashLineThickness" as string, min: 0.5, max: 8, step: 0.5, def: 2.5 },
                { label: "내부크기", key: "flashInnerRadius" as string, min: 0.5, max: 0.98, step: 0.01, def: 0.88 },
              ] : [
                { label: "선 간격", key: "flashLineSpacing" as string, min: 0.05, max: 1, step: 0.05, def: 0.3 },
                { label: "선 두께", key: "flashLineThickness" as string, min: 0.1, max: 4, step: 0.1, def: 0.8 },
                { label: "선 길이", key: "flashLineLength" as string, min: 5, max: 100, step: 1, def: 30 },
                { label: "선 개수", key: "flashLineCount" as string, min: 8, max: 60, step: 1, def: 24 },
                { label: "내부크기", key: "flashInnerRadius" as string, min: 0.2, max: 0.9, step: 0.05, def: 0.65 },
                ...(selectedBubble.style === "flash_black"
                  ? [
                      { label: "돌기 수", key: "flashBumpCount" as string, min: 6, max: 60, step: 1, def: 24 },
                      { label: "돌기 높이", key: "flashBumpHeight" as string, min: 1, max: 30, step: 1, def: 10 },
                    ]
                  : []),
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                      {label} {step < 1 ? (val as number).toFixed(2) : val}
                    </span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
              {selectedBubble.style !== "flash_eyelash" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground flex-1">내부 채우기</span>
                  <button
                    onClick={() => updateBubble(selectedBubble.id, { flashFilled: !(selectedBubble.flashFilled ?? true) })}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${(selectedBubble.flashFilled ?? true) ? "border-primary/40 bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"}`}
                  >
                    {(selectedBubble.flashFilled ?? true) ? "채움 ✓" : "비움"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 귓속말(dashed) 설정 */}
          {selectedBubble.style === "dashed" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">귓속말 설정</p>
              {([
                { label: "점선 길이", key: "flashLineLength", min: 2, max: 30, step: 1, def: 12 },
                { label: "점선 간격", key: "flashLineSpacing", min: 0.1, max: 3, step: 0.1, def: 1.0 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(1) : val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* 위엄(brush) 설정 */}
          {selectedBubble.style === "brush" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">위엄 먹선 설정</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">굵기 배율 {(selectedBubble.flashLineThickness ?? 2.5).toFixed(1)}</span>
                <Slider value={[selectedBubble.flashLineThickness ?? 2.5]} onValueChange={([v]) => updateBubble(selectedBubble.id, { flashLineThickness: v })} min={0.5} max={6} step={0.1} className="flex-1" />
              </div>
            </div>
          )}

          {/* 흐물(drip) 설정 */}
          {selectedBubble.style === "drip" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">흐물 설정</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">흔들림 {selectedBubble.wobble ?? 5}</span>
                <Slider value={[selectedBubble.wobble ?? 5]} onValueChange={([v]) => updateBubble(selectedBubble.id, { wobble: v })} min={0} max={20} step={0.5} className="flex-1" />
              </div>
            </div>
          )}

          {/* 신비(sparkle_ring) 설정 */}
          {selectedBubble.style === "sparkle_ring" && (
            <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <p className="text-[11px] font-semibold text-muted-foreground">신비 설정</p>
              {([
                { label: "바늘 수", key: "flashLineCount", min: 12, max: 120, step: 1, def: 48 },
                { label: "바늘 길이", key: "flashLineLength", min: 2, max: 40, step: 1, def: 12 },
              ]).map(({ label, key, min, max, step, def }) => {
                const val = (selectedBubble as any)[key] ?? def;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {val}</span>
                    <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                  </div>
                );
              })}
            </div>
          )}

          {/* 말꼬리 */}
          <div className="space-y-2">
            <Label className="text-[13px] mb-1 block">말꼬리 스타일</Label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(TAIL_LABELS).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => updateBubble(selectedBubble.id, {
                    tailStyle: k as TailStyle,
                    tailTipX: undefined, tailTipY: undefined,
                    tailCtrl1X: undefined, tailCtrl1Y: undefined,
                    tailCtrl2X: undefined, tailCtrl2Y: undefined,
                  })}
                  className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${selectedBubble.tailStyle === k ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"}`}
                  data-testid={`btn-tail-${k}`}
                >{l}</button>
              ))}
            </div>
          </div>

          {selectedBubble.tailStyle !== "none" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[13px] mb-1 block">방향</Label>
                  <Select
                    value={selectedBubble.tailDirection}
                    onValueChange={(v) =>
                      updateBubble(selectedBubble.id, {
                        tailDirection: v as SpeechBubble["tailDirection"],
                        tailTipX: undefined, tailTipY: undefined,
                        tailCtrl1X: undefined, tailCtrl1Y: undefined,
                        tailCtrl2X: undefined, tailCtrl2Y: undefined,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-tail-direction">
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
                <div className="flex items-end">
                  <Button type="button" variant="outline" size="sm" onClick={handleFlipTailHorizontally} className="w-full">
                    좌우 반전
                  </Button>
                </div>
              </div>

              {/* 꼬리 고급 설정 (long / short 스타일일 때) */}
              {(selectedBubble.tailStyle === "long" || selectedBubble.tailStyle === "short") && (
                <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">꼬리 세부 조정</p>
                  {([
                    { label: "밑넓이", key: "tailBaseSpread", min: 1, max: 60, step: 1, def: 8 },
                    { label: "곡선", key: "tailCurve", min: 0, max: 1, step: 0.05, def: 0.5 },
                    { label: "흔들림", key: "tailJitter", min: 0, max: 5, step: 0.1, def: 1 },
                    { label: "끝 뭉툭함", key: "tailTipSpread", min: 0, max: 30, step: 1, def: 0 },
                  ]).map(({ label, key, min, max, step, def }) => {
                    const val = (selectedBubble as any)[key] ?? def;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label} {step < 1 ? val.toFixed(2) : val}</span>
                        <Slider value={[val]} onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)} min={min} max={max} step={step} className="flex-1" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 점점점 꼬리 설정 */}
              {selectedBubble.tailStyle.startsWith("dots_") && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[13px] mb-1 block">점 크기</Label>
                    <Slider value={[selectedBubble.dotsScale ?? 1]} onValueChange={([v]) => updateBubble(selectedBubble.id, { dotsScale: v })} min={0.5} max={1.5} step={0.05} data-testid="slider-dots-scale" />
                  </div>
                  <div>
                    <Label className="text-[13px] mb-1 block">점 간격</Label>
                    <Slider value={[selectedBubble.dotsSpacing ?? 1]} onValueChange={([v]) => updateBubble(selectedBubble.id, { dotsSpacing: v })} min={0.5} max={1.5} step={0.05} data-testid="slider-dots-spacing" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <Label className="text-[13px]">글자 크기</Label>
              <span className="text-[12px] text-muted-foreground tabular-nums">{selectedBubble.fontSize}px</span>
            </div>
            <Slider value={[selectedBubble.fontSize]} onValueChange={([v]) => updateBubble(selectedBubble.id, { fontSize: v })} min={8} max={40} step={1} data-testid="slider-font-size" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <Label className="text-[13px]">테두리 두께</Label>
              <span className="text-[12px] text-muted-foreground tabular-nums">{selectedBubble.strokeWidth}px</span>
            </div>
            <Slider value={[selectedBubble.strokeWidth]} onValueChange={([v]) => updateBubble(selectedBubble.id, { strokeWidth: v })} min={1} max={8} step={0.5} data-testid="slider-stroke-width" />
          </div>

          {/* Fill / Stroke Color */}
          <div className="space-y-2">
            <Label className="text-[13px] block">채우기 / 테두리 색</Label>
            <div className="flex flex-wrap gap-1.5">
              {BUBBLE_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  title={preset.label}
                  onClick={() => updateBubble(selectedBubble.id, { fillColor: preset.fill, strokeColor: preset.stroke })}
                  className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${selectedBubble.fillColor === preset.fill ? "border-foreground scale-110" : "border-border"}`}
                  style={{
                    background: preset.fill === "transparent"
                      ? "linear-gradient(135deg, #ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%)"
                      : preset.fill,
                    backgroundSize: preset.fill === "transparent" ? "6px 6px" : undefined,
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] mb-1 block text-muted-foreground">채우기 색</Label>
                <input type="color" value={selectedBubble.fillColor && selectedBubble.fillColor !== "transparent" ? selectedBubble.fillColor : "#ffffff"} onChange={(e) => updateBubble(selectedBubble.id, { fillColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border border-border" />
              </div>
              <div>
                <Label className="text-[11px] mb-1 block text-muted-foreground">테두리 색</Label>
                <input type="color" value={selectedBubble.strokeColor || "#222222"} onChange={(e) => updateBubble(selectedBubble.id, { strokeColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border border-border" />
              </div>
            </div>
          </div>

          {/* Draw Mode */}
          <div>
            <Label className="text-[13px] mb-1.5 block">그리기 모드</Label>
            <div className="flex gap-1 flex-wrap">
              {(["both", "fill_only", "stroke_only"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateBubble(selectedBubble.id, { drawMode: mode })}
                  className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${(selectedBubble.drawMode ?? "both") === mode ? "border-primary/40 bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"}`}
                >
                  {mode === "both" ? "채움+테두리" : mode === "fill_only" ? "채움만" : "테두리만"}
                </button>
              ))}
            </div>
          </div>

          {/* Fill Opacity */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <Label className="text-[13px]">채우기 투명도</Label>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {Math.round((selectedBubble.fillOpacity ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              value={[(selectedBubble.fillOpacity ?? 1) * 100]}
              onValueChange={([v]) => updateBubble(selectedBubble.id, { fillOpacity: v / 100 })}
              min={0} max={100} step={5}
            />
          </div>
        </div>
      )}
      {/* 말풍선 전용 목록은 제거하고, 상단 레이어 목록만 사용 */}

      {
        (isBubbleMode || isTemplateMode) && showBubbleTemplatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBubbleTemplatePicker(false)} data-testid="modal-story-template-picker">
            <Card className="w-full max-w-lg max-h-[70vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-wrap">
                <h3 className="text-sm font-semibold">말풍선 템플릿</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowBubbleTemplatePicker(false)} data-testid="button-close-story-templates">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto flex-wrap">
                {BUBBLE_TEMPLATE_CATEGORIES.map((cat, ci) => (
                  <Badge
                    key={ci}
                    className={`cursor-pointer shrink-0 toggle-elevate ${ci === templateCatIdx ? "toggle-elevated" : ""}`}
                    variant={ci === templateCatIdx ? "default" : "outline"}
                    onClick={() => setTemplateCatIdx(ci)}
                    data-testid={`badge-story-template-cat-${ci}`}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
              <div className="overflow-y-auto p-4 flex-1">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {BUBBLE_TEMPLATE_CATEGORIES[templateCatIdx]?.ids.map((id) => {
                    const path = bubblePath(id);
                    return (
                      <div
                        key={id}
                        className="aspect-square rounded-md border border-border overflow-hidden cursor-pointer hover-elevate bg-muted/30 p-1.5"
                        onClick={() => addBubbleTemplate(path)}
                        data-testid={`story-template-item-${id}`}
                      >
                        <img src={path} alt={`말풍선 ${id}`} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )
      }
    </div >
  );
}

interface UsageData {
  credits: number;
  tier: string;
  totalGenerations: number;
  creatorTier: number;
  dailyFreeCredits: number;
  maxStoryPanels: number;
}

export default function StoryPage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [aiMode, setAiMode] = useState<"subtitle" | "instatoonFull" | "instatoonPrompt" | null>(null);
  // 인스타툰 자동화 생성용 - 기준 캐릭터 이미지
  const [autoRefImageUrl, setAutoRefImageUrl] = useState<string | null>(null);
  const [autoRefImageName, setAutoRefImageName] = useState<string>("");
  const [showAutoGalleryPicker, setShowAutoGalleryPicker] = useState(false);
  // 프롬프트 자동작성용 - 기준 캐릭터 이미지
  const [promptRefImageUrl, setPromptRefImageUrl] = useState<string | null>(null);
  const [promptRefImageName, setPromptRefImageName] = useState<string>("");
  const [showPromptGalleryPicker, setShowPromptGalleryPicker] = useState(false);
  const autoRefInputRef = useRef<HTMLInputElement>(null);
  const promptRefInputRef = useRef<HTMLInputElement>(null);
  const [panels, setPanelsRaw] = useState<PanelData[]>([createPanel()]);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [posePrompt, setPosePrompt] = useState("");
  const [expressionPrompt, setExpressionPrompt] = useState("");
  const [itemPrompt, setItemPrompt] = useState("");
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [instatoonScenePrompt, setInstatoonScenePrompt] = useState("");

  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [aiLimitOpen, setAiLimitOpen] = useState(false);

  const historyRef = useRef<PanelData[][]>([]);
  const futureRef = useRef<PanelData[][]>([]);
  const skipHistoryRef = useRef(false);
  const MAX_HISTORY = 50;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "story-font-css";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = FONT_CSS;
      document.head.appendChild(style);
    }
  }, []);

  const clonePanels = useCallback((src: PanelData[]): PanelData[] => {
    return src.map((p) => ({
      ...p,
      bubbles: p.bubbles.map((b) => ({ ...b })),
      characters: p.characters.map((c) => ({ ...c })),
      topScript: p.topScript ? { ...p.topScript } : null,
      bottomScript: p.bottomScript ? { ...p.bottomScript } : null,
      backgroundImageUrl: p.backgroundImageUrl,
      backgroundImageEl: p.backgroundImageEl,
    }));
  }, []);

  const setPanels = useCallback(
    (updater: PanelData[] | ((prev: PanelData[]) => PanelData[])) => {
      setPanelsRaw((prev) => {
        if (!skipHistoryRef.current) {
          historyRef.current = [
            ...historyRef.current.slice(-(MAX_HISTORY - 1)),
            clonePanels(prev),
          ];
          futureRef.current = [];
        }
        skipHistoryRef.current = false;
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    [clonePanels],
  );

  const rehydrateImages = useCallback((panels: PanelData[]) => {
    panels.forEach((p) => {
      p.characters.forEach((c) => {
        if (!c.imageEl && c.imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            c.imageEl = img;
            setPanelsRaw((cur) => [...cur]);
          };
          img.src = c.imageUrl;
        }
      });
      p.bubbles.forEach((b) => {
        if (b.style === "image" && b.templateSrc && !b.templateImg) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            b.templateImg = img;
            setPanelsRaw((cur) => [...cur]);
          };
          img.src = b.templateSrc;
        }
      });
      // Rehydrate background image
      if (p.backgroundImageUrl && !p.backgroundImageEl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          p.backgroundImageEl = img;
          setPanelsRaw((cur) => [...cur]);
        };
        img.src = p.backgroundImageUrl;
      }
    });
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    setPanelsRaw((prev) => {
      futureRef.current = [...futureRef.current, clonePanels(prev)];
      const restored = historyRef.current.pop()!;
      rehydrateImages(restored);
      return restored;
    });
  }, [clonePanels, rehydrateImages]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setPanelsRaw((prev) => {
      historyRef.current = [...historyRef.current, clonePanels(prev)];
      const restored = futureRef.current.pop()!;
      rehydrateImages(restored);
      return restored;
    });
  }, [clonePanels, rehydrateImages]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const [zoom, setZoom] = useState(100);
  const flowZoomScale = zoom / 100;
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [panMode, setPanMode] = useState(false);
  const panDraggingRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panScrollStartRef = useRef<{ left: number; top: number } | null>(null);
  const [captureActive, setCaptureActive] = useState(false);
  const [blockCapture] = useState(true);
  const [activeScriptSection, setActiveScriptSection] = useState<"top" | "bottom">("top");

  const fitToView = useCallback(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const areaW = area.clientWidth - 48;
    const areaH = area.clientHeight - 48;
    if (areaW <= 0 || areaH <= 0) return;
    const fitScale = Math.min(areaW / CANVAS_W, areaH / CANVAS_H, 2);
    setZoom(Math.round(fitScale * 100));
  }, []);

  /* 최초 진입 시 기본 100% 유지 */

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((z) => {
          const dir = e.deltaY < 0 ? 1.1 : 0.9;
          const nz = Math.round(Math.max(20, Math.min(200, z * dir)));
          return nz;
        });
      }
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel as any);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPanMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setPanMode(false);
        panDraggingRef.current = false;
        panStartRef.current = null;
        panScrollStartRef.current = null;
        const area = canvasAreaRef.current;
        if (area) area.style.cursor = "default";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoom((z) => Math.min(200, z + 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(20, z - 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoom(100);
      } else if (e.key === "PrintScreen") {
        if (blockCapture) {
          setCaptureActive(true);
          toast({ title: "스크린캡쳐 차단", description: "화면 캡쳐가 감지되어 캔버스를 보호합니다." });
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const area = canvasAreaRef.current;
        if (!area) return;
        const dx = e.key === "ArrowLeft" ? -50 : e.key === "ArrowRight" ? 50 : 0;
        const dy = e.key === "ArrowUp" ? -50 : e.key === "ArrowDown" ? 50 : 0;
        area.scrollBy({ left: dx, top: dy, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitToView]);

  useEffect(() => {
    const onBlur = () => {
      if (blockCapture) setCaptureActive(true);
    };
    const onFocus = () => setCaptureActive(false);
    const onVisibility = () => {
      if (document.visibilityState !== "visible" && blockCapture) {
        setCaptureActive(true);
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [blockCapture]);

  const { data: usageData } = useQuery<UsageData>({ queryKey: ["/api/usage"] });
  const maxPanels = usageData?.maxStoryPanels ?? 3;
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts || typeof document.fonts.ready?.then !== "function") {
      setFontsReady(true);
      return;
    }
    document.fonts.ready.then(() => {
      setFontsReady(true);
    }).catch(() => {
      setFontsReady(true);
    });
  }, []);

  const { data: galleryData, isLoading: galleryLoading } = useQuery<
    Generation[]
  >({
    queryKey: ["/api/gallery"],
  });

  const getDailyKey = (feature: string) => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `daily_${feature}_${y}${m}${day}`;
  };
  const getDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const raw = localStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  };
  const incDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const n = getDailyCount(feature) + 1;
    localStorage.setItem(key, String(n));
  };

  const generateMutation = useMutation({
    mutationFn: async (variables: { mode: "basic" | "full" }) => {
      const body: any = {
        topic,
        panelCount: panels.length,
      };
      if (variables.mode === "full") {
        if (instatoonScenePrompt.trim()) {
          body.backgroundPrompt = instatoonScenePrompt.trim();
        } else {
          if (posePrompt.trim()) body.posePrompt = posePrompt.trim();
          if (expressionPrompt.trim()) body.expressionPrompt = expressionPrompt.trim();
          if (itemPrompt.trim()) body.itemPrompt = itemPrompt.trim();
          if (backgroundPrompt.trim()) body.backgroundPrompt = backgroundPrompt.trim();
        }
        if (autoRefImageUrl) body.referenceImageUrl = autoRefImageUrl;
      }
      const res = await apiRequest("POST", "/api/story-scripts", body);
      return res.json() as Promise<{ panels: StoryPanelScript[] }>;
    },
    onSuccess: (data) => {
      setPanels((prev) =>
        prev.map((panel, i) => {
          if (!data.panels[i]) return panel;
          const aiPanel = data.panels[i];
          const newBubbles: SpeechBubble[] = (aiPanel.bubbles || [])
            .map((b, bi) => {
              const yPositions = [
                CANVAS_H * 0.3,
                CANVAS_H * 0.5,
                CANVAS_H * 0.65,
                CANVAS_H * 0.4,
                CANVAS_H * 0.55,
              ];
              const xPositions = [
                CANVAS_W * 0.35,
                CANVAS_W * 0.6,
                CANVAS_W * 0.45,
                CANVAS_W * 0.3,
                CANVAS_W * 0.65,
              ];
              return createBubble(
                CANVAS_W,
                CANVAS_H,
                b.text,
                (b.style as BubbleStyle) || "handwritten",
              );
            })
            .map((nb, bi) => ({
              ...nb,
              x: [CANVAS_W * 0.25, CANVAS_W * 0.45, CANVAS_W * 0.35][bi % 3],
              y: [CANVAS_H * 0.2, CANVAS_H * 0.45, CANVAS_H * 0.65][bi % 3],
            }));

          return {
            ...panel,
            topScript: aiPanel.top
              ? { text: aiPanel.top, style: "no-bg", color: "yellow" }
              : null,
            bottomScript: aiPanel.bottom
              ? { text: aiPanel.bottom, style: "no-bg", color: "sky" }
              : null,
            bubbles: newBubbles.length > 0 ? newBubbles : panel.bubbles,
          };
        }),
      );
      const totalBubbles = data.panels.reduce(
        (sum, p) => sum + (p.bubbles?.length || 0),
        0,
      );
      toast({
        title: "스크립트 생성 완료",
        description: `${data.panels.length}개 패널, ${totalBubbles}개 말풍선이 생성되었습니다`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin((o) =>
          toast({
            title: o.title,
            description: o.description,
            variant: o.variant as any,
          }),
        );
        return;
      }
      if (/^403: /.test(error.message) && error.message.includes("크레딧을 전부 사용했어요")) {
        setAiLimitOpen(true);
        toast({
          title: "크레딧 부족",
          description: "크레딧을 전부 사용했어요. 충전해주세요.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "생성 실패",
        description: error.message || "스크립트 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const instatoonImageMutation = useMutation({
    mutationFn: async () => {
      if (!autoRefImageUrl) {
        throw new Error("먼저 기준 캐릭터 이미지를 선택해주세요.");
      }

      // Generate one image per panel
      const results: { panelId: string; imageUrl: string }[] = [];
      for (let i = 0; i < panels.length; i++) {
        const parts: string[] = [];
        if (instatoonScenePrompt.trim()) {
          parts.push(instatoonScenePrompt.trim());
          if (i > 0) parts.push(`장면 ${i + 1}`);
        } else {
          if (topic.trim()) parts.push(`주제: ${topic.trim()}, 장면 ${i + 1}`);
          if (posePrompt.trim() || expressionPrompt.trim()) {
            parts.push(
              `포즈/표정: ${[posePrompt.trim(), expressionPrompt.trim()]
                .filter(Boolean)
                .join(" ")}`,
            );
          }
          if (backgroundPrompt.trim()) {
            parts.push(`배경: ${backgroundPrompt.trim()}`);
          }
          if (itemPrompt.trim()) {
            parts.push(`아이템: ${itemPrompt.trim()}`);
          }
        }
        const bgPrompt = parts.length > 0 ? parts.join(" / ") : topic.trim();
        const items = instatoonScenePrompt.trim()
          ? undefined
          : itemPrompt.trim() || undefined;
        const res = await apiRequest("POST", "/api/generate-background", {
          sourceImageData: autoRefImageUrl,
          backgroundPrompt: bgPrompt || undefined,
          itemsPrompt: items,
          characterId: null,
        });
        const data = await res.json() as { imageUrl: string };
        results.push({ panelId: panels[i].id, imageUrl: data.imageUrl });
      }
      return results;
    },
    onSuccess: (results) => {
      // Load images and set as panel backgrounds
      results.forEach(({ panelId, imageUrl }) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setPanels((prev) =>
            prev.map((p) =>
              p.id === panelId
                ? {
                    ...p,
                    backgroundImageUrl: imageUrl,
                    backgroundImageEl: img,
                  }
                : p,
            ),
          );
        };
        img.src = imageUrl;
      });
      toast({
        title: "인스타툰 이미지 생성 완료",
        description: `${results.length}개 패널에 캐릭터와 배경이 생성되었습니다.`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin((o) =>
          toast({
            title: o.title,
            description: o.description,
            variant: o.variant as any,
          }),
        );
        return;
      }
      toast({
        title: "이미지 생성 실패",
        description: error.message || "인스타툰 이미지를 생성하지 못했습니다",
        variant: "destructive",
      });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/story-topic-suggest", {});
      return res.json() as Promise<{ topics: string[] }>;
    },
    onSuccess: (data) => {
      if (data.topics?.length) {
        const t = data.topics[Math.floor(Math.random() * data.topics.length)];
        setTopic(t);
        toast({
          title: "주제 추천",
          description: `"${t}" 주제가 선택되었습니다`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "추천 실패",
        description: error.message || "주제 추천에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const posePromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", {
        type: "pose",
      });
      return res.json() as Promise<{ prompt: string }>;
    },
    onSuccess: (data) => {
      setPosePrompt(data.prompt);
      setExpressionPrompt(data.prompt);
      toast({
        title: "포즈/표정 프롬프트 생성 완료",
        description: "AI가 제안한 포즈/표정을 적용했습니다.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin((o) =>
          toast({
            title: o.title,
            description: o.description,
            variant: o.variant as any,
          }),
        );
        return;
      }
      toast({
        title: "생성 실패",
        description: error.message || "프롬프트 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const backgroundPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", {
        type: "background",
      });
      return res.json() as Promise<{ prompt: string }>;
    },
    onSuccess: (data) => {
      let bg = data.prompt;
      let items = "";
      try {
        const parsed = JSON.parse(data.prompt);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.background === "string" && parsed.background) {
            bg = parsed.background;
          }
          if (typeof parsed.items === "string") {
            items = parsed.items;
          }
        }
      } catch {
      }
      setBackgroundPrompt(bg);
      setItemPrompt(items);
      toast({
        title: "배경/아이템 프롬프트 생성 완료",
        description: "AI가 제안한 배경과 아이템을 적용했습니다.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin((o) =>
          toast({
            title: o.title,
            description: o.description,
            variant: o.variant as any,
          }),
        );
        return;
      }
      toast({
        title: "생성 실패",
        description: error.message || "프롬프트 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const instatoonPromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-prompt", {
        type: "background",
        referenceImageUrl: promptRefImageUrl ?? undefined,
      });
      const data = (await res.json()) as { prompt: string };
      return data.prompt;
    },
    onSuccess: (rawPrompt) => {
      let scene = rawPrompt;
      try {
        const parsed = JSON.parse(rawPrompt);
        if (parsed && typeof parsed === "object") {
          const bg = (parsed as any).background;
          const items = (parsed as any).items;
          if (typeof bg === "string" && bg) {
            scene = typeof items === "string" && items ? `${bg} / ${items}` : bg;
          }
        }
      } catch {}
      setInstatoonScenePrompt(scene);
      toast({
        title: "인스타툰 프롬프트 생성 완료",
        description: "인스타툰 전체 프롬프트를 자동으로 채웠습니다.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin((o) =>
          toast({
            title: o.title,
            description: o.description,
            variant: o.variant as any,
          }),
        );
        return;
      }
      toast({
        title: "생성 실패",
        description: error.message || "프롬프트 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // 이미지 파일 → base64 변환 후 state에 저장
  const handleAutoRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAutoRefImageUrl(ev.target?.result as string);
      setAutoRefImageName(file.name);
      setShowAutoGalleryPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePromptRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPromptRefImageUrl(ev.target?.result as string);
      setPromptRefImageName(file.name);
      setShowPromptGalleryPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const TIER_NAMES = ["입문 작가", "신인 작가", "인기 작가", "프로 연재러"];
  const TIER_PANEL_LIMITS = [3, 5, 8, 10];

  const addPanel = () => {
    if (panels.length >= maxPanels) {
      const currentTier = usageData?.creatorTier ?? 0;
      if (currentTier < 3) {
        const nextTierName = TIER_NAMES[currentTier + 1];
        const nextLimit = TIER_PANEL_LIMITS[currentTier + 1];
        toast({
          title: `패널 ${maxPanels}개 제한`,
          description: `${nextTierName} 등급이 되면 최대 ${nextLimit}개까지 추가 가능합니다`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "최대 패널 수 도달",
          description: "최대 10개의 패널까지 추가할 수 있습니다",
          variant: "destructive",
        });
      }
      return;
    }
    const newPanels = [...panels, createPanel()];
    setPanels(newPanels);
    setActivePanelIndex(newPanels.length - 1);
  };

  const removePanel = (idx: number) => {
    if (panels.length <= 1) return;
    const newPanels = panels.filter((_, i) => i !== idx);
    setPanels(newPanels);
    setActivePanelIndex(Math.min(activePanelIndex, newPanels.length - 1));
  };

  const duplicatePanel = (idx: number) => {
    if (panels.length >= maxPanels) {
      toast({ title: "최대 패널 수 도달", description: `최대 ${maxPanels}개까지 추가할 수 있습니다`, variant: "destructive" });
      return;
    }
    const source = panels[idx];
    const cloned: PanelData = {
      id: generateId(),
      topScript: source.topScript ? { ...source.topScript } : null,
      bottomScript: source.bottomScript ? { ...source.bottomScript } : null,
      backgroundImageUrl: source.backgroundImageUrl,
      backgroundImageEl: source.backgroundImageEl,
      bubbles: source.bubbles.map((b) => ({ ...b, id: generateId() })),
      characters: source.characters.map((c) => ({ ...c, id: generateId() })),
    };
    const newPanels = [...panels];
    newPanels.splice(idx + 1, 0, cloned);
    setPanels(newPanels);
    setActivePanelIndex(idx + 1);
  };

  const updatePanel = (idx: number, updated: PanelData) => {
    setPanels((prev) => prev.map((p, i) => (i === idx ? updated : p)));
  };

  const resetAll = () => {
    setPanels([createPanel()]);
    setActivePanelIndex(0);
    setTopic("");
  };

  const activePanel = panels[activePanelIndex];
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const panelCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const bubbleTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  type LeftTab = "image" | "ai" | "script" | "bubble" | "template" | null;
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>(null);

  const toggleLeftTab = (tab: LeftTab) => {
    setActiveLeftTab((prev) => (prev === tab ? null : tab));
  };

  const downloadPanel = (idx: number) => {
    const isPro = usageData?.tier === "pro";
    const credits = usageData?.credits ?? 0;
    if (!isPro && credits <= 0) {
      toast({ title: "크레딧 부족", description: "다운로드는 크레딧이 필요합니다. Pro 업그레이드 또는 크레딧을 구매하세요.", variant: "destructive" });
      return;
    }
    const p = panels[idx];
    const canvas = panelCanvasRefs.current.get(p.id);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `panel_${idx + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadAll = () => {
    panels.forEach((_, i) => {
      setTimeout(() => downloadPanel(i), i * 200);
    });
  };

  const handleShareInstagram = async (idx: number) => {
    const p = panels[idx];
    const canvas = panelCanvasRefs.current.get(p.id);
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) return;
      const file = new File([blob], `charagen-panel-${idx + 1}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "CharaGen 스토리",
          text: "CharaGen으로 만든 인스타툰 패널",
          files: [file],
        });
        toast({ title: "공유 완료", description: "Instagram에 공유되었습니다." });
      } else {
        downloadPanel(idx);
        window.open("https://www.instagram.com/", "_blank");
        toast({ title: "Instagram 열기", description: "이미지가 다운로드되었습니다. Instagram에서 새 게시물로 업로드하세요." });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        downloadPanel(idx);
        toast({ title: "다운로드 완료", description: "이미지가 저장되었습니다. Instagram에서 업로드하세요." });
      }
    }
  };

  const serializeStoryData = useCallback(() => {
    return JSON.stringify({
      panels: panels.map((p) => ({
        id: p.id,
        topScript: p.topScript,
        bottomScript: p.bottomScript,
        backgroundImageUrl: p.backgroundImageUrl,
        bubbles: p.bubbles.map((b) => ({
          ...b,
          templateImg: undefined,
        })),
        characters: p.characters.map((c) => ({
          id: c.id,
          imageUrl: c.imageUrl,
          x: c.x,
          y: c.y,
          scale: c.scale,
        })),
      })),
      topic,
    });
  }, [panels, topic]);

  const getStoryThumbnail = useCallback(() => {
    const firstPanel = panels[0];
    if (!firstPanel) return "";
    const canvas = panelCanvasRefs.current.get(firstPanel.id);
    if (!canvas) return "";
    const thumbCanvas = document.createElement("canvas");
    const thumbW = 300;
    const thumbH = Math.round((CANVAS_H / CANVAS_W) * thumbW);
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    const ctx = thumbCanvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
    return thumbCanvas.toDataURL("image/png", 0.7);
  }, [panels]);

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({ title: "프로젝트 이름을 입력하세요", variant: "destructive" });
      return;
    }
    setSavingProject(true);
    try {
      const canvasData = serializeStoryData();
      const thumbnailUrl = getStoryThumbnail();
      if (currentProjectId) {
        await apiRequest("PATCH", `/api/bubble-projects/${currentProjectId}`, {
          name: projectName.trim(),
          canvasData,
          thumbnailUrl,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/bubble-projects"] });
        toast({ title: "프로젝트 저장됨", description: `"${projectName.trim()}" 업데이트 완료` });
      } else {
        const res = await apiRequest("POST", "/api/bubble-projects", {
          name: projectName.trim(),
          canvasData,
          thumbnailUrl,
          editorType: "story",
        });
        const newProject = await res.json();
        setCurrentProjectId(newProject.id);
        queryClient.invalidateQueries({ queryKey: ["/api/bubble-projects"] });
        toast({ title: "프로젝트 저장됨", description: `"${projectName.trim()}" 생성 완료` });
      }
      setShowSaveModal(false);
    } catch (e: any) {
      toast({ title: "저장 실패", description: e.message || "프로젝트를 저장할 수 없습니다.", variant: "destructive" });
    } finally {
      setSavingProject(false);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const loadProjectId = urlParams.get("projectId");

  const { data: loadedProject } = useQuery<any>({
    queryKey: ["/api/bubble-projects", loadProjectId],
    enabled: isAuthenticated && !!loadProjectId,
  });

  const projectLoadedRef = useRef(false);
  useEffect(() => {
    if (loadedProject && !projectLoadedRef.current) {
      projectLoadedRef.current = true;
      setCurrentProjectId(loadedProject.id);
      setProjectName(loadedProject.name);
      try {
        const data = JSON.parse(loadedProject.canvasData);
        if (data.topic) setTopic(data.topic);
        if (data.panels && Array.isArray(data.panels)) {
          const restoredPanels: PanelData[] = data.panels.map((p: any) => ({
            id: p.id || generateId(),
            topScript: p.topScript || null,
            bottomScript: p.bottomScript || null,
            backgroundImageUrl: p.backgroundImageUrl || undefined,
            backgroundImageEl: null,
            bubbles: (p.bubbles || []).map((b: any) => ({
              ...b,
              templateImg: undefined,
            })),
            characters: (p.characters || []).map((c: any) => ({
              ...c,
              imageEl: null,
            })),
          }));
          rehydrateImages(restoredPanels);
          setPanelsRaw(restoredPanels);
          setActivePanelIndex(0);
        }
      } catch (e) {
        toast({ title: "프로젝트 로드 실패", variant: "destructive" });
      }
    }
  }, [loadedProject]);

  const isPro = usageData?.tier === "pro";
  const canAllFontsStory = isPro || (usageData?.creatorTier ?? 0) >= 3;
  const availableFonts = canAllFontsStory ? KOREAN_FONTS : KOREAN_FONTS.slice(0, 3);

  const startStoryTour = useCallback(() => {
    const ensureDriver = () =>
      new Promise<void>((resolve) => {
        const hasDriver = (window as any)?.driver?.js?.driver;
        if (hasDriver) {
          resolve();
          return;
        }
        const cssId = "driverjs-css";
        if (!document.getElementById(cssId)) {
          const link = document.createElement("link");
          link.id = cssId;
          link.rel = "stylesheet";
          link.href = "https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.css";
          document.head.appendChild(link);
        }
        const scriptId = "driverjs-script";
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.js.iife.js";
          script.onload = () => resolve();
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });
    ensureDriver().then(() => {
      const driver = (window as any).driver.js.driver;
      const driverObj = driver({
        overlayColor: "rgba(0,0,0,0.6)",
        showProgress: true,
        steps: [
          {
            element: '[data-testid="canvas-toolbar"]',
            popover: { title: "툴바", description: "패널 추가, 실행 취소 등을 할 수 있어요." },
          },
          {
            element: '[data-testid="button-add-panel"]',
            popover: { title: "패널 추가", description: "스토리 패널을 추가합니다." },
          },
          {
            element: '[data-testid="button-undo"]',
            popover: { title: "실행 취소", description: "최근 변경을 되돌립니다." },
          },
          {
            element: '[data-testid="button-redo"]',
            popover: { title: "다시 실행", description: "되돌린 변경을 다시 적용합니다." },
          },
          {
            element: '[data-testid="story-canvas-area"]',
            popover: { title: "캔버스", description: "패널에서 말풍선/캐릭터를 편집하세요." },
          },
          {
            element: '[data-testid="button-download-panel"]',
            popover: { title: "다운로드", description: "현재 패널을 이미지로 저장합니다." },
          },
          {
            element: '[data-testid="button-save-story-project"]',
            popover: { title: "프로젝트 저장", description: "작업을 프로젝트로 저장합니다." },
          },
        ],
      });
      driverObj.drive();
    });
  }, []);
  const LEFT_TABS: { id: LeftTab; icon: typeof Wand2; label: string }[] = [
    { id: "image", icon: ImageIcon as any, label: "이미지 선택" },
    { id: "ai", icon: Wand2, label: "AI 프롬프트" },
    { id: "script", icon: Type as any, label: "자막 설정" },
    { id: "bubble", icon: MessageSquare as any, label: "말풍선" },
    { id: "template", icon: Layers as any, label: "템플릿" },
  ];

  return (
    <div className="editor-page h-[calc(100vh-3.5rem)] flex overflow-hidden bg-muted/30 dark:bg-background relative">
      <EditorOnboarding editor="story" />
      <div
        className="flex flex-col items-center py-3 px-1.5 gap-5 w-[56px] shrink-0 bg-card dark:bg-card border-r"
        data-testid="left-icon-sidebar"
      >
        {LEFT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleLeftTab(tab.id)}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg text-[10px] gap-0.5 transition-colors ${activeLeftTab === tab.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover-elevate"}`}
            data-testid={`button-left-tab-${tab.id}`}
          >
            <tab.icon className="h-[18px] w-[18px]" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 h-full">
        {activeLeftTab && (
          <div
            className="h-full w-[320px] bg-card overflow-y-auto border-r"
            data-testid="left-panel-content"
          >
            <div className="p-3 space-y-5">
                  {activeLeftTab === "ai" && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">AI 프롬프트 / 인스타툰 생성</h3>
                        <button
                          onClick={() => setActiveLeftTab(null)}
                          className="text-muted-foreground hover-elevate rounded-md p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        무료 3회 이후부터는 스토리 AI 생성마다 크레딧이 사용돼요.
                      </p>

                      <div className="grid grid-cols-1 gap-2 mt-3">
                        <Button
                          variant={aiMode === "subtitle" ? "default" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => setAiMode("subtitle")}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          AI 프롬프트 자막 생성
                        </Button>
                        <Button
                          variant={aiMode === "instatoonFull" ? "default" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => setAiMode("instatoonFull")}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          인스타툰 자동화 생성
                        </Button>
                        <Button
                          variant={aiMode === "instatoonPrompt" ? "default" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => setAiMode("instatoonPrompt")}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          인스타툰 프롬프트 자동 작성
                        </Button>
                      </div>

                      {aiMode === "subtitle" && (
                        <div className="mt-4 space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              placeholder="주제 입력 (예: 월요일 출근길)"
                              className="text-sm"
                              data-testid="input-story-topic"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => suggestMutation.mutate()}
                              disabled={suggestMutation.isPending}
                              data-testid="button-suggest-topic"
                            >
                              {suggestMutation.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <Lightbulb className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => {
                              generateMutation.mutate({ mode: "basic" });
                            }}
                            disabled={!topic.trim() || generateMutation.isPending}
                            data-testid="button-generate-scripts"
                          >
                            {generateMutation.isPending ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            AI 자막 생성 실행
                          </Button>
                        </div>
                      )}

                      {aiMode === "instatoonFull" && (
                        <div className="mt-4 space-y-4">
                          {/* STEP 1 : 기준 캐릭터 이미지 */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">① 기준 캐릭터 이미지</span>
                              <span className="text-[10px] text-destructive font-medium">필수</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              이 캐릭터 이미지를 기반으로 포즈·표정·배경이 자동 변형됩니다.
                            </p>

                            {/* 이미지 미리보기 */}
                            {autoRefImageUrl ? (
                              <div className="relative w-full aspect-square max-w-[100px] rounded-lg overflow-hidden border border-border bg-muted mx-auto">
                                <img src={autoRefImageUrl} alt="기준 캐릭터" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => { setAutoRefImageUrl(null); setAutoRefImageName(""); }}
                                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                                  <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5 text-green-400" />
                                  {autoRefImageName || "선택됨"}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {/* 직접 업로드 */}
                                <button
                                  onClick={() => autoRefInputRef.current?.click()}
                                  className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/70 transition-colors"
                                >
                                  <UploadCloud className="h-5 w-5 text-muted-foreground/70" />
                                  <span className="text-[11px] font-medium">이미지 업로드</span>
                                  <span className="text-[10px] opacity-70">JPG·PNG</span>
                                </button>
                                {/* 갤러리에서 가져오기 */}
                                <button
                                  onClick={() => setShowAutoGalleryPicker((v) => !v)}
                                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-3 text-xs transition-colors ${showAutoGalleryPicker ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/70"}`}
                                >
                                  <ImagePlus className="h-5 w-5 opacity-70" />
                                  <span className="text-[11px] font-medium">갤러리에서</span>
                                  <span className="text-[10px] opacity-70">생성 이미지</span>
                                </button>
                              </div>
                            )}

                            <input
                              ref={autoRefInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAutoRefImageUpload}
                            />

                            {/* 갤러리 그리드 */}
                            {showAutoGalleryPicker && (
                              <div className="space-y-1.5">
                                <p className="text-[11px] text-muted-foreground">생성된 이미지 선택:</p>
                                {galleryLoading ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                  </div>
                                ) : !galleryData?.length ? (
                                  <p className="text-[11px] text-muted-foreground text-center py-3">
                                    생성된 이미지가 없어요.<br />먼저 캐릭터를 만들어주세요.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto">
                                    {galleryData.map((gen) => (
                                      <button
                                        key={gen.id}
                                        className="aspect-square rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                                        onClick={() => {
                                          setAutoRefImageUrl(gen.resultImageUrl);
                                          setAutoRefImageName(gen.prompt?.slice(0, 20) ?? "갤러리 이미지");
                                          setShowAutoGalleryPicker(false);
                                        }}
                                      >
                                        <img src={gen.resultImageUrl} alt={gen.prompt} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* STEP 2 : 주제 */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground">② 인스타툰 주제</span>
                            <div className="flex gap-2">
                              <Input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="주제 입력 (예: 월요일 출근길)"
                                className="text-sm"
                                data-testid="input-story-topic"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => suggestMutation.mutate()}
                                disabled={suggestMutation.isPending}
                                data-testid="button-suggest-topic"
                              >
                                {suggestMutation.isPending ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                  <Lightbulb className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* STEP 3 : 전체 인스타툰 프롬프트 (선택) */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              ③ 인스타툰 전체 프롬프트{" "}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                (선택 — 포즈·표정·배경·아이템을 한 번에 적어도 돼요)
                              </span>
                            </span>
                            <Textarea
                              value={instatoonScenePrompt}
                              onChange={(e) => setInstatoonScenePrompt(e.target.value)}
                              placeholder="예: 비 오는 월요일 출근길, 주인공은 커피를 들고 지하철 안에서 멍한 표정으로 서 있고, 뒤에는 붐비는 사람들과 형광 조명이 보인다"
                              className="text-xs resize-none"
                              rows={3}
                            />
                            <p className="text-[10px] text-muted-foreground">
                              빈칸으로 두면 아래 포즈/표정·배경/아이템 칸을 기준으로 생성돼요.
                            </p>
                          </div>

                          {/* STEP 4 : 포즈/표정 (선택) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                ④ 포즈 / 표정{" "}
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  (선택 — 비우면 AI가 자동 결정)
                                </span>
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => posePromptMutation.mutate()}
                                disabled={posePromptMutation.isPending}
                              >
                                {posePromptMutation.isPending ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                                ) : (
                                  <span className="text-[11px]">AI 추천</span>
                                )}
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <Textarea
                                value={posePrompt}
                                onChange={(e) => setPosePrompt(e.target.value)}
                                placeholder="포즈 (예: 양팔을 번쩍 들고 놀란 포즈)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                              <Textarea
                                value={expressionPrompt}
                                onChange={(e) => setExpressionPrompt(e.target.value)}
                                placeholder="표정 (예: 입을 크게 벌리고 동공지진 난 표정)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* STEP 5 : 배경/아이템 (선택) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                ④ 배경 / 아이템 <span className="text-[10px] font-normal text-muted-foreground">(선택)</span>
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => backgroundPromptMutation.mutate()}
                                disabled={backgroundPromptMutation.isPending}
                              >
                                {backgroundPromptMutation.isPending ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                                ) : (
                                  <span className="text-[11px]">AI 추천</span>
                                )}
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <Textarea
                                value={backgroundPrompt}
                                onChange={(e) => setBackgroundPrompt(e.target.value)}
                                placeholder="배경 (예: 퇴근길 지하철 안, 붐비는 플랫폼)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                              <Textarea
                                value={itemPrompt}
                                onChange={(e) => setItemPrompt(e.target.value)}
                                placeholder="아이템/소품 (예: 커피컵, 스마트폰)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          {!autoRefImageUrl && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2.5 py-1.5">
                              ⚠️ 기준 캐릭터 이미지를 선택해야 포즈·표정이 자동 변형됩니다.
                            </p>
                          )}

                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => {
                              if (!autoRefImageUrl) {
                                toast({
                                  title: "기준 이미지 필요",
                                  description: "먼저 기준 캐릭터 이미지를 업로드하거나 갤러리에서 선택해주세요.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              generateMutation.mutate({ mode: "full" });
                              instatoonImageMutation.mutate();
                            }}
                            disabled={
                              !topic.trim() ||
                              generateMutation.isPending ||
                              instatoonImageMutation.isPending
                            }
                          >
                            {generateMutation.isPending ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            인스타툰 자동 생성 실행
                          </Button>
                        </div>
                      )}

                      {aiMode === "instatoonPrompt" && (
                        <div className="mt-4 space-y-4">
                          {/* 기준 이미지 선택 */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">기준 캐릭터 이미지</span>
                              <span className="text-[10px] text-muted-foreground">(선택 — 있으면 더 정확해요)</span>
                            </div>

                            {promptRefImageUrl ? (
                              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2">
                                <img src={promptRefImageUrl} alt="기준" className="h-10 w-10 rounded object-cover border border-border flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium truncate">{promptRefImageName || "선택된 이미지"}</p>
                                  <p className="text-[10px] text-muted-foreground">이 캐릭터 기반으로 프롬프트 자동 작성</p>
                                </div>
                                <button
                                  onClick={() => { setPromptRefImageUrl(null); setPromptRefImageName(""); }}
                                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => promptRefInputRef.current?.click()}
                                  className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 p-2.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/70 transition-colors"
                                >
                                  <UploadCloud className="h-4 w-4 opacity-70" />
                                  <span className="text-[11px]">이미지 업로드</span>
                                </button>
                                <button
                                  onClick={() => setShowPromptGalleryPicker((v) => !v)}
                                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-2.5 text-xs transition-colors ${showPromptGalleryPicker ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/70"}`}
                                >
                                  <ImagePlus className="h-4 w-4 opacity-70" />
                                  <span className="text-[11px]">갤러리에서</span>
                                </button>
                              </div>
                            )}

                            <input
                              ref={promptRefInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePromptRefImageUpload}
                            />

                            {showPromptGalleryPicker && (
                              <div className="space-y-1.5">
                                {galleryLoading ? (
                                  <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                ) : !galleryData?.length ? (
                                  <p className="text-[11px] text-muted-foreground text-center py-2">생성된 이미지가 없어요.</p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-1.5 max-h-[150px] overflow-y-auto">
                                    {galleryData.map((gen) => (
                                      <button
                                        key={gen.id}
                                        className="aspect-square rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                                        onClick={() => {
                                          setPromptRefImageUrl(gen.resultImageUrl);
                                          setPromptRefImageName(gen.prompt?.slice(0, 20) ?? "갤러리 이미지");
                                          setShowPromptGalleryPicker(false);
                                        }}
                                      >
                                        <img src={gen.resultImageUrl} alt={gen.prompt} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 포즈/표정 - 입력하면 배경/아이템은 자동 */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-foreground">포즈 / 표정</span>
                              <span className="text-[10px] text-muted-foreground ml-1">— 입력하면 배경이 자동 완성됩니다</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <Textarea
                                value={posePrompt}
                                onChange={(e) => setPosePrompt(e.target.value)}
                                placeholder="포즈 프롬프트 (예: 양팔을 번쩍 들고 놀란 포즈)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                              <Textarea
                                value={expressionPrompt}
                                onChange={(e) => setExpressionPrompt(e.target.value)}
                                placeholder="표정 프롬프트 (예: 입을 크게 벌리고 동공지진 난 표정)"
                                className="text-xs resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* 배경/아이템 - 자동 생성 or 수동 입력 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                배경 / 아이템
                                {(posePrompt.trim() || expressionPrompt.trim()) && (
                                  <span className="ml-1.5 text-[10px] font-normal text-primary">← 자동 생성 가능</span>
                                )}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <Textarea
                                value={backgroundPrompt}
                                onChange={(e) => setBackgroundPrompt(e.target.value)}
                                placeholder="배경 프롬프트 — 비워도 AI가 자동으로 채워줍니다"
                                className="text-xs resize-none"
                                rows={2}
                              />
                              <Textarea
                                value={itemPrompt}
                                onChange={(e) => setItemPrompt(e.target.value)}
                                placeholder="아이템/소품 프롬프트 — 비워도 자동 생성됩니다"
                                className="text-xs resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => instatoonPromptMutation.mutate()}
                            disabled={instatoonPromptMutation.isPending}
                          >
                            {instatoonPromptMutation.isPending ? (
                              <div className="h-4 w-4 animate-spin rounded-full border border-primary-foreground border-t-transparent mr-2" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            {(posePrompt.trim() || expressionPrompt.trim())
                              ? "배경/아이템 자동 완성"
                              : "전체 프롬프트 자동 작성"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  {activeLeftTab === "image" && activePanel && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold">이미지 선택</h3>
                        <button
                          onClick={() => setActiveLeftTab(null)}
                          className="text-muted-foreground hover-elevate rounded-md p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <EditorPanel
                        panel={activePanel}
                        index={activePanelIndex}
                        total={panels.length}
                        onUpdate={(updated) => updatePanel(activePanelIndex, updated)}
                        onRemove={() => removePanel(activePanelIndex)}
                        galleryImages={galleryData ?? []}
                        galleryLoading={galleryLoading}
                        selectedBubbleId={selectedBubbleId}
                        setSelectedBubbleId={setSelectedBubbleId}
                        selectedCharId={selectedCharId}
                        setSelectedCharId={setSelectedCharId}
                        creatorTier={usageData?.creatorTier ?? 0}
                        isPro={isPro}
                        mode="image"
                      />
                    </>
                  )}

                {activeLeftTab === "bubble" && activePanel && (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold">말풍선</h3>
                      <button
                        onClick={() => setActiveLeftTab(null)}
                        className="text-muted-foreground hover-elevate rounded-md p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <EditorPanel
                      panel={activePanel}
                      index={activePanelIndex}
                      total={panels.length}
                      onUpdate={(updated) => updatePanel(activePanelIndex, updated)}
                      onRemove={() => removePanel(activePanelIndex)}
                      galleryImages={galleryData ?? []}
                      galleryLoading={galleryLoading}
                      selectedBubbleId={selectedBubbleId}
                      setSelectedBubbleId={setSelectedBubbleId}
                      selectedCharId={selectedCharId}
                      setSelectedCharId={setSelectedCharId}
                      creatorTier={usageData?.creatorTier ?? 0}
                      isPro={isPro}
                      mode="bubble"
                      bubbleTextareaRef={bubbleTextareaRef}
                    />
                  </>
                )}

                {activeLeftTab === "template" && activePanel && (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold">템플릿 가져오기</h3>
                      <button
                        onClick={() => setActiveLeftTab(null)}
                        className="text-muted-foreground hover-elevate rounded-md p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <EditorPanel
                      panel={activePanel}
                      index={activePanelIndex}
                      total={panels.length}
                      onUpdate={(updated) => updatePanel(activePanelIndex, updated)}
                      onRemove={() => removePanel(activePanelIndex)}
                      galleryImages={galleryData ?? []}
                      galleryLoading={galleryLoading}
                      selectedBubbleId={selectedBubbleId}
                      setSelectedBubbleId={setSelectedBubbleId}
                      selectedCharId={selectedCharId}
                      setSelectedCharId={setSelectedCharId}
                      creatorTier={usageData?.creatorTier ?? 0}
                      isPro={isPro}
                      mode="template"
                    />
                  </>
                )}

                  {activeLeftTab === "script" && activePanel && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">자막 설정</h3>
                        <button
                          onClick={() => setActiveLeftTab(null)}
                          className="text-muted-foreground hover-elevate rounded-md p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        패널 {activePanelIndex + 1}의 상단/하단 스크립트를
                        설정합니다.
                      </p>

                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant={activeScriptSection === "top" ? "secondary" : "outline"}
                          onClick={() => {
                            const p = activePanel;
                            updatePanel(activePanelIndex, {
                              ...p,
                              topScript:
                                p.topScript ?? { text: "", style: "no-bg", color: "yellow" },
                            });
                            setActiveScriptSection("top");
                          }}
                          data-testid={`button-toggle-top-script-${activePanelIndex}`}
                        >
                          <AlignVerticalJustifyStart className="h-3.5 w-3.5 mr-1" />
                          상단
                        </Button>
                        <Button
                          size="sm"
                          variant={activeScriptSection === "bottom" ? "secondary" : "outline"}
                          onClick={() => {
                            const p = activePanel;
                            updatePanel(activePanelIndex, {
                              ...p,
                              bottomScript:
                                p.bottomScript ?? { text: "", style: "no-bg", color: "sky" },
                            });
                            setActiveScriptSection("bottom");
                          }}
                          data-testid={`button-toggle-bottom-script-${activePanelIndex}`}
                        >
                          <AlignVerticalJustifyEnd className="h-3.5 w-3.5 mr-1" />
                          하단
                        </Button>
                      </div>

                      {activeScriptSection === "top" && activePanel.topScript && (
                        <div className="space-y-2 rounded-md bg-muted/30 p-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[11px] shrink-0 bg-yellow-400/20 text-yellow-700 dark:text-yellow-400"
                            >
                              상단
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              title="상단 스크립트 삭제"
                              onClick={() => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, { ...p, topScript: null });
                              }}
                              data-testid={`button-delete-top-script-${activePanelIndex}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Textarea
                            value={activePanel.topScript.text}
                            onChange={(e) => {
                              const p = activePanel;
                              updatePanel(activePanelIndex, {
                                ...p,
                                topScript: {
                                  ...p.topScript!,
                                  text: e.target.value,
                                },
                              });
                            }}
                            placeholder="상단 스크립트..."
                            className="text-sm min-h-[150px] resize-none"
                            data-testid={`input-panel-${activePanelIndex}-top`}
                          />
                          <div className="flex gap-1 flex-wrap">
                            {SCRIPT_STYLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    topScript: {
                                      ...p.topScript!,
                                      style: opt.value,
                                    },
                                  });
                                }}
                                className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${activePanel.topScript!.style === opt.value ? "border-foreground/40 bg-foreground/10 font-semibold" : "border-border hover-elevate"}`}
                                data-testid={`button-top-script-style-${opt.value}-${activePanelIndex}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1 flex-wrap items-center">
                            <span className="text-[11px] text-muted-foreground mr-0.5">
                              색상
                            </span>
                            {SCRIPT_COLOR_OPTIONS.map((c) => (
                              <button
                                key={c.value}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    topScript: { ...p.topScript!, color: c.value },
                                  });
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform ${activePanel.topScript!.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c.bg }}
                                title={c.label}
                                data-testid={`button-top-script-color-${c.value}-${activePanelIndex}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              글씨 크기
                            </span>
                            <Slider
                              min={8}
                              max={36}
                              step={1}
                              value={[activePanel.topScript.fontSize || 20]}
                              onValueChange={([v]) => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  topScript: { ...p.topScript!, fontSize: v },
                                });
                              }}
                              className="flex-1"
                              data-testid={`slider-top-script-fontsize-${activePanelIndex}`}
                            />
                            <span className="text-[11px] text-muted-foreground w-6 text-right">
                              {activePanel.topScript.fontSize || 20}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              글꼴
                            </span>
                            <Select
                              value={activePanel.topScript.fontKey || "default"}
                              onValueChange={(v) => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  topScript: { ...p.topScript!, fontKey: v },
                                });
                              }}
                            >
                              <SelectTrigger className="h-7 text-[11px] flex-1" data-testid={`select-top-script-font-${activePanelIndex}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFonts.map((f) => (
                                  <SelectItem key={f.value} value={f.value} className="text-[11px]">
                                    <span style={{ fontFamily: f.family }}>{f.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-1 flex-wrap items-center">
                            <span className="text-[11px] text-muted-foreground mr-0.5">
                              글자색
                            </span>
                            {SCRIPT_TEXT_COLORS.map((c) => (
                              <button
                                key={c.value || "auto"}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    topScript: { ...p.topScript!, textColor: c.value },
                                  });
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform ${(activePanel.topScript!.textColor || "") === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c.hex || "transparent", backgroundImage: c.hex ? undefined : "linear-gradient(135deg, #ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%)", backgroundSize: c.hex ? undefined : "6px 6px" }}
                                title={c.label}
                                data-testid={`button-top-script-textcolor-${c.value || "auto"}-${activePanelIndex}`}
                              />
                            ))}
                            <button
                              onClick={() => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  topScript: { ...p.topScript!, bold: !(p.topScript!.bold !== false) },
                                });
                              }}
                              className={`px-1.5 py-0.5 text-[11px] rounded-md border transition-colors font-bold ${activePanel.topScript!.bold !== false ? "border-foreground/40 bg-foreground/10" : "border-border hover-elevate"}`}
                              data-testid={`button-top-script-bold-${activePanelIndex}`}
                            >
                              B
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            캔버스에서 드래그하여 위치를 이동할 수 있습니다
                          </p>
                        </div>
                      )}

                      {activeScriptSection === "bottom" && activePanel.bottomScript && (
                        <div className="space-y-2 rounded-md bg-muted/30 p-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[11px] shrink-0 bg-sky-400/20 text-sky-700 dark:text-sky-400"
                            >
                              하단
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              title="하단 스크립트 삭제"
                              onClick={() => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, { ...p, bottomScript: null });
                              }}
                              data-testid={`button-delete-bottom-script-${activePanelIndex}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Textarea
                            value={activePanel.bottomScript.text}
                            onChange={(e) => {
                              const p = activePanel;
                              updatePanel(activePanelIndex, {
                                ...p,
                                bottomScript: {
                                  ...p.bottomScript!,
                                  text: e.target.value,
                                },
                              });
                            }}
                            placeholder="하단 스크립트..."
                            className="text-sm min-h-[150px] resize-none"
                            data-testid={`input-panel-${activePanelIndex}-bottom`}
                          />
                          <div className="flex gap-1 flex-wrap">
                            {SCRIPT_STYLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    bottomScript: {
                                      ...p.bottomScript!,
                                      style: opt.value,
                                    },
                                  });
                                }}
                                className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${activePanel.bottomScript!.style === opt.value ? "border-foreground/40 bg-foreground/10 font-semibold" : "border-border hover-elevate"}`}
                                data-testid={`button-bottom-script-style-${opt.value}-${activePanelIndex}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1 flex-wrap items-center">
                            <span className="text-[11px] text-muted-foreground mr-0.5">
                              색상
                            </span>
                            {SCRIPT_COLOR_OPTIONS.map((c) => (
                              <button
                                key={c.value}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    bottomScript: {
                                      ...p.bottomScript!,
                                      color: c.value,
                                    },
                                  });
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform ${activePanel.bottomScript!.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c.bg }}
                                title={c.label}
                                data-testid={`button-bottom-script-color-${c.value}-${activePanelIndex}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              글씨 크기
                            </span>
                            <Slider
                              min={8}
                              max={36}
                              step={1}
                              value={[activePanel.bottomScript.fontSize || 20]}
                              onValueChange={([v]) => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  bottomScript: { ...p.bottomScript!, fontSize: v },
                                });
                              }}
                              className="flex-1"
                              data-testid={`slider-bottom-script-fontsize-${activePanelIndex}`}
                            />
                            <span className="text-[11px] text-muted-foreground w-6 text-right">
                              {activePanel.bottomScript.fontSize || 20}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              글꼴
                            </span>
                            <Select
                              value={activePanel.bottomScript.fontKey || "default"}
                              onValueChange={(v) => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  bottomScript: { ...p.bottomScript!, fontKey: v },
                                });
                              }}
                            >
                              <SelectTrigger className="h-7 text-[11px] flex-1" data-testid={`select-bottom-script-font-${activePanelIndex}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFonts.map((f) => (
                                  <SelectItem key={f.value} value={f.value} className="text-[11px]">
                                    <span style={{ fontFamily: f.family }}>{f.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-1 flex-wrap items-center">
                            <span className="text-[11px] text-muted-foreground mr-0.5">
                              글자색
                            </span>
                            {SCRIPT_TEXT_COLORS.map((c) => (
                              <button
                                key={c.value || "auto"}
                                onClick={() => {
                                  const p = activePanel;
                                  updatePanel(activePanelIndex, {
                                    ...p,
                                    bottomScript: { ...p.bottomScript!, textColor: c.value },
                                  });
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform ${(activePanel.bottomScript!.textColor || "") === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c.hex || "transparent", backgroundImage: c.hex ? undefined : "linear-gradient(135deg, #ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%)", backgroundSize: c.hex ? undefined : "6px 6px" }}
                                title={c.label}
                                data-testid={`button-bottom-script-textcolor-${c.value || "auto"}-${activePanelIndex}`}
                              />
                            ))}
                            <button
                              onClick={() => {
                                const p = activePanel;
                                updatePanel(activePanelIndex, {
                                  ...p,
                                  bottomScript: { ...p.bottomScript!, bold: !(p.bottomScript!.bold !== false) },
                                });
                              }}
                              className={`px-1.5 py-0.5 text-[11px] rounded-md border transition-colors font-bold ${activePanel.bottomScript!.bold !== false ? "border-foreground/40 bg-foreground/10" : "border-border hover-elevate"}`}
                              data-testid={`button-bottom-script-bold-${activePanelIndex}`}
                            >
                              B
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            캔버스에서 드래그하여 위치를 이동할 수 있습니다
                          </p>
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>
          )}

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div
              className="w-full relative"
              data-testid="canvas-toolbar"
            >
              <div
                className="flex items-center justify-between gap-3 px-5 py-2 w-full flex-wrap bg-background/60 dark:bg-background/40"
                style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 mr-1">
                    <div className="w-6 h-6 rounded-md bg-[hsl(173_100%_35%)] flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight" data-testid="text-story-title">스토리</span>
                  </div>
                  <div className="flex items-center gap-0.5 bg-muted/40 dark:bg-muted/20 rounded-md px-0.5 py-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setActivePanelIndex(Math.max(0, activePanelIndex - 1))}
                      disabled={activePanelIndex === 0}
                      data-testid="button-prev-panel"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[11px] font-medium tabular-nums px-1 min-w-[2.5rem] text-center" data-testid="text-panel-indicator">
                      {activePanelIndex + 1} / {panels.length}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setActivePanelIndex(Math.min(panels.length - 1, activePanelIndex + 1))}
                      disabled={activePanelIndex >= panels.length - 1}
                      data-testid="button-next-panel"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" onClick={addPanel} disabled={panels.length >= maxPanels} className="gap-1 h-7 text-xs px-2" data-testid="button-add-panel">
                    <Plus className="h-3 w-3" />
                    추가
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePanel(activePanelIndex)}
                    disabled={panels.length <= 1}
                    className="gap-1 h-7 text-xs px-2 text-red-500"
                    data-testid="button-remove-panel"
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </Button>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={undo} disabled={historyRef.current.length === 0} title="실행 취소 (Ctrl+Z)" data-testid="button-undo">
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={redo} disabled={futureRef.current.length === 0} title="다시 실행 (Ctrl+Shift+Z)" data-testid="button-redo">
                      <Redo2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetAll} title="초기화" data-testid="button-reset-story">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startStoryTour} title="도움말" data-testid="button-story-help">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadPanel(activePanelIndex)} title="다운로드" data-testid="button-download-panel">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 text-xs px-2"
                    onClick={downloadAll}
                    data-testid="button-download-all-panels"
                  >
                    <Download className="h-3 w-3" />
                    전체 다운로드
                  </Button>

                  <Button size="sm" onClick={() => setShowSaveModal(true)} className="gap-1 h-7 text-xs px-2.5 bg-[hsl(173_100%_35%)] text-white border-[hsl(173_100%_35%)]" data-testid="button-save-story-project">
                    <Save className="h-3 w-3" />
                    저장
                    {isPro && <Crown className="h-2.5 w-2.5 ml-0.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLocation("/edits")} title="내 편집" data-testid="button-story-my-edits">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[hsl(173_100%_35%)] to-transparent opacity-60" />
            </div>

            {/* Main Canvas Area - List View */}
            <div
              ref={canvasAreaRef}
              className={`flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/10 ${zoom >= 200 ? "p-0" : "p-8"}`}
              data-testid="story-canvas-area"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedBubbleId(null);
                  setSelectedCharId(null);
                }
              }}
            >
              <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 pb-32">
                {panels.map((panel, i) => (
                  <ContextMenu key={panel.id}>
                    <ContextMenuTrigger>
                      <div
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget) {
                            setSelectedBubbleId(null);
                            setSelectedCharId(null);
                          }
                        }}
                        onClick={() => setActivePanelIndex(i)}
                        className={`relative shadow-lg transition-all ${activePanelIndex === i ? "ring-4 ring-primary ring-offset-2" : "opacity-90 hover:opacity-100"}`}
                      >
                        <div className="absolute -left-12 top-0 flex flex-col gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold shadow-sm ${activePanelIndex === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                        </div>
                        {panels.length > 1 && (
                          <button
                            type="button"
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-red-500 shadow hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePanel(i);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <PanelCanvas
                          key={panel.id + "-main"}
                          panel={panel}
                          onUpdate={(updated) => updatePanel(i, updated)}
                          selectedBubbleId={activePanelIndex === i ? selectedBubbleId : null}
                          onSelectBubble={(id) => {
                            setSelectedBubbleId(id);
                            setSelectedCharId(null);
                            setActivePanelIndex(i);
                          }}
                          selectedCharId={activePanelIndex === i ? selectedCharId : null}
                          onSelectChar={(id) => {
                            setSelectedCharId(id);
                            setSelectedBubbleId(null);
                            setActivePanelIndex(i);
                          }}
                          canvasRef={(el) => {
                            if (el) panelCanvasRefs.current.set(panel.id, el);
                            else panelCanvasRefs.current.delete(panel.id);
                          }}
                          zoom={zoom}
                          fontsReady={fontsReady}
                          isPro={isPro}
                          onEditBubble={() => {
                            // Focus sidebar bubble textarea
                            setTimeout(() => bubbleTextareaRef.current?.focus(), 80);
                          }}
                        />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuLabel>Page {i + 1}</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => {
                          const newPanel = {
                            ...panel,
                            id: generateId(),
                            bubbles: panel.bubbles.map((b) => ({ ...b, id: generateId() })),
                            characters: panel.characters.map((c) => ({ ...c, id: generateId() })),
                          };
                          const newPanels = [...panels];
                          newPanels.splice(i + 1, 0, newPanel);
                          setPanels(newPanels);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Duplicate Page
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => removePanel(i)}
                        className="text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Page
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}

                <Button variant="outline" className="h-24 w-full max-w-[500px] border-dashed" onClick={addPanel} disabled={panels.length >= maxPanels}>
                  <Plus className="mr-2 h-6 w-6 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Add New Page</span>
                </Button>
              </div>
            </div>
            
          </div>


          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-border bg-background shrink-0" data-testid="story-bottom-toolbar">
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.max(20, z - 10))}
                disabled={zoom <= 20}
                data-testid="button-story-zoom-out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Slider
                min={20}
                max={200}
                step={5}
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                className="w-28"
                data-testid="slider-story-zoom"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                disabled={zoom >= 200}
                data-testid="button-story-zoom-in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums w-9 text-right" data-testid="text-story-zoom-value">{zoom}%</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <Button
              size="icon"
              variant="ghost"
              onClick={fitToView}
              title="화면에 맞추기"
              data-testid="button-story-fit-to-view"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom(200)}
              title="전체 화면"
              data-testid="button-story-fullscreen"
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

            <Dialog open={aiLimitOpen} onOpenChange={setAiLimitOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">크레딧 부족</DialogTitle>
                  <DialogDescription>크레딧을 전부 사용했어요. 충전해주세요.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full gap-1.5" data-testid="button-upgrade-pro-ai">
                    <a href="/pricing">크레딧 충전 / Pro 업그레이드</a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setAiLimitOpen(false)}
                    data-testid="button-close-ai-limit"
                  >
                    닫기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
              <DialogContent className="max-w-sm" data-testid="modal-save-story">
                <DialogHeader>
                  <DialogTitle className="text-base">스토리 프로젝트 저장</DialogTitle>
                </DialogHeader>
                {isPro ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="프로젝트 이름"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      data-testid="input-story-project-name"
                    />
                    <div className="space-y-2">
                      <Button
                        className="w-full gap-1.5"
                        onClick={handleSaveProject}
                        disabled={savingProject || !projectName.trim()}
                        data-testid="button-save-story-confirm"
                      >
                        {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {currentProjectId ? "업데이트" : "저장하기"}
                      </Button>

                    </div>
                    {currentProjectId && (
                      <p className="text-[11px] text-muted-foreground text-center">
                        기존 프로젝트를 덮어씁니다
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Crown className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pro 전용 기능</p>
                      <p className="text-xs text-muted-foreground">프로젝트 저장/관리는 Pro 멤버십 전용 기능입니다.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button asChild className="w-full gap-1.5" data-testid="button-upgrade-pro-story">
                        <a href="/pricing">
                          <Crown className="h-3.5 w-3.5" />
                          Pro 업그레이드
                        </a>
                      </Button>

                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div >
          );
}
