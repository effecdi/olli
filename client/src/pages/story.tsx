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
  Settings2,
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
} from "lucide-react";
import { FlowStepper } from "@/components/flow-stepper";
import { EditorOnboarding } from "@/components/editor-onboarding";
import { getFlowState, clearFlowState } from "@/lib/flow";
import type { StoryPanelScript, Generation } from "@shared/schema";

function bubblePath(n: number) {
  return `/assets/bubbles/bubble_${String(n).padStart(3, "0")}.png`;
}

type TemplateCategory = { label: string; ids: number[] };
const BUBBLE_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { label: "말풍선 (외침/효과)", ids: [109, 110, 111, 112, 113] },
  { label: "이펙트 / 스티커", ids: [108, 114, 115, 116, 117] },
];

type BubbleStyle = "handwritten" | "linedrawing" | "wobbly" | "thought" | "shout" | "rectangle" | "rounded" | "doubleline" | "wavy" | "image";
type TailStyle =
  | "none"
  | "long"
  | "short"
  | "dots_handwritten"
  | "dots_linedrawing";
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
  | "move-script-top"
  | "move-script-bottom"
  | "resize-script-top"
  | "resize-script-bottom"
  | "move-tail";

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

const KOREAN_FONTS = [
  {
    value: "default",
    label: "기본 고딕",
    family: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  { value: "NanumPen", label: "나눔손글씨 펜", family: "'NanumPen', cursive" },
  {
    value: "NanumBrush",
    label: "나눔손글씨 붓",
    family: "'NanumBrush', cursive",
  },
  { value: "KyoboHand", label: "교보손글씨", family: "'KyoboHand', cursive" },
  { value: "DaraeHand", label: "다래손글씨", family: "'DaraeHand', cursive" },
  {
    value: "KotraHand",
    label: "코트라 손글씨",
    family: "'KotraHand', cursive",
  },
  { value: "Haesom", label: "온글잎 해솜", family: "'Haesom', cursive" },
  {
    value: "GowunDodum",
    label: "고운 도둠",
    family: "'GowunDodum', sans-serif",
  },
  { value: "MitmiFont", label: "온글잎 밋미", family: "'MitmiFont', cursive" },
  { value: "Hanna", label: "배민 한나", family: "'Hanna', sans-serif" },
  {
    value: "KCCGanpan",
    label: "KCC 간판체",
    family: "'KCCGanpan', sans-serif",
  },
  { value: "Dovemayo", label: "도브메이요", family: "'Dovemayo', sans-serif" },
  { value: "LeeSeoyun", label: "이서윤체", family: "'LeeSeoyun', cursive" },
  { value: "MaruBuri", label: "마루 부리", family: "'MaruBuri', serif" },
];

const FONT_CSS = `
@font-face { font-family: 'NanumPen'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumPen.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'NanumBrush'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumBrush.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'KyoboHand'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/KyoboHand.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'DaraeHand'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_three@1.0/drfont_daraehand.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'KotraHand'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/KOTRA_SONGEULSSI.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'Haesom'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105@1.1/Hesom.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'GowunDodum'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/GowunDodum-Regular.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'MitmiFont'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_1@1.0/Ownglyph_meetme-Rg.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'Hanna'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/BMHANNAAir.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'KCCGanpan'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCGanpan.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'Dovemayo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/Dovemayo.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'LeeSeoyun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2104@1.0/LeeSeoyun.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'MaruBuri'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff') format('woff'); font-weight: normal; font-display: swap; }
`;

interface SpeechBubble {
  id: string;
  seed: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: BubbleStyle;
  tailStyle: TailStyle;
  tailDirection: "bottom" | "left" | "right" | "top";
  tailTipX?: number;
  tailTipY?: number;
  tailBaseSpread?: number;
  tailLength?: number;
  tailCurve?: number;
  tailJitter?: number;
  dotsScale?: number;
  dotsSpacing?: number;
  strokeWidth: number;
  wobble: number;
  fontSize: number;
  fontKey: string;
  templateSrc?: string;
  templateImg?: HTMLImageElement;
  zIndex?: number;
}

interface CharacterPlacement {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  imageEl: HTMLImageElement | null;
  zIndex?: number;
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

function getFontFamily(fontKey: string): string {
  const font = KOREAN_FONTS.find((f) => f.value === fontKey);
  return font ? font.family : KOREAN_FONTS[0].family;
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
  };
}

const STYLE_LABELS: Record<BubbleStyle, string> = {
  handwritten: "손글씨",
  linedrawing: "심플 라인",
  wobbly: "불안한 말풍선",
  thought: "생각 구름",
  shout: "외침 / 효과",
  rectangle: "사각형",
  rounded: "둥근 사각형",
  doubleline: "이중선",
  wavy: "물결",
  image: "이미지 말풍선",
};

const TAIL_LABELS: Record<TailStyle, string> = {
  none: "없음",
  long: "길게 빼기",
  short: "짧게 빼기",
  dots_handwritten: "점점점 (손글씨)",
  dots_linedrawing: "점점점 (라인)",
};

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

function getDefaultTailTip(b: SpeechBubble) {
  const cx = b.x + b.width / 2,
    cy = b.y + b.height / 2;
  const styleLen =
    b.tailStyle === "long" ||
    b.tailStyle === "dots_handwritten" ||
    b.tailStyle === "dots_linedrawing"
      ? 50
      : 25;
  const tailLen = b.tailLength ?? styleLen;
  switch (b.tailDirection) {
    case "bottom":
      return { x: cx + 10, y: b.y + b.height + tailLen };
    case "top":
      return { x: cx + 10, y: b.y - tailLen };
    case "left":
      return { x: b.x - tailLen, y: cy + 10 };
    case "right":
      return { x: b.x + b.width + tailLen, y: cy + 10 };
  }
}

function getTailGeometry(b: SpeechBubble) {
  const cx = b.x + b.width / 2,
    cy = b.y + b.height / 2;
  const defaultTip = getDefaultTailTip(b);
  const tipX = b.tailTipX ?? defaultTip.x;
  const tipY = b.tailTipY ?? defaultTip.y;

  const angle = Math.atan2(tipY - cy, tipX - cx);
  const perpAngle = angle + Math.PI / 2;
  const baseSpread = b.tailBaseSpread ?? 8;

  const edgeX = cx + Math.cos(angle) * (b.width / 2);
  const edgeY = cy + Math.sin(angle) * (b.height / 2);

  const baseAx = edgeX + Math.cos(perpAngle) * baseSpread;
  const baseAy = edgeY + Math.sin(perpAngle) * baseSpread;
  const baseBx = edgeX - Math.cos(perpAngle) * baseSpread;
  const baseBy = edgeY - Math.sin(perpAngle) * baseSpread;

  const tailLen = Math.sqrt((tipX - cx) ** 2 + (tipY - cy) ** 2);
  return { tipX, tipY, baseAx, baseAy, baseBx, baseBy, tailLen };
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  bubble: SpeechBubble,
  isSelected: boolean,
) {
  ctx.save();
  const {
    x,
    y,
    width: w,
    height: h,
    style,
    strokeWidth: sw,
    wobble: wob,
    seed,
  } = bubble;
  const hasTail = bubble.tailStyle === "long" || bubble.tailStyle === "short";
  const hasDots =
    bubble.tailStyle === "dots_handwritten" ||
    bubble.tailStyle === "dots_linedrawing";
  const rand = seededRandom(seed + 1000);
  const isDoubleLine = style === "doubleline";
  const isImage = style === "image";

  if (isImage) {
    if (bubble.templateImg) {
      ctx.drawImage(bubble.templateImg, x, y, w, h);
    } else {
      ctx.save();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.restore();
    }
  } else if (!isImage) {
    switch (style) {
      case "handwritten":
        drawHandwrittenPath(ctx, x, y, w, h, sw, seed);
        break;
      case "linedrawing":
        drawLinedrawingPath(ctx, x, y, w, h, sw);
        break;
      case "wobbly":
        drawWobblyPath(ctx, x, y, w, h, sw, wob);
        break;
      case "thought":
        drawThoughtPath(ctx, x, y, w, h, sw, seed);
        break;
      case "shout":
        drawShoutPath(ctx, x, y, w, h, sw, seed);
        break;
      case "rectangle":
        drawRectanglePath(ctx, x, y, w, h, sw);
        break;
      case "rounded":
        drawRoundedPath(ctx, x, y, w, h, sw);
        break;
      case "doubleline":
        drawDoublelinePath(ctx, x, y, w, h, sw);
        break;
      case "wavy":
        drawWavyPath(ctx, x, y, w, h, sw);
        break;
    }

    if (!isDoubleLine) {
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#222";
      ctx.stroke();
    }
  }

  if (hasTail) {
    const geo = getTailGeometry(bubble);
    const r2 = seededRandom(seed + 1000);
    const jitterScale = bubble.tailJitter ?? 1;

    ctx.beginPath();
    if (style === "handwritten") {
      const rFill = seededRandom(seed + 1000);
      ctx.moveTo(
        geo.baseAx + (rFill() - 0.5) * 3 * jitterScale,
        geo.baseAy + (rFill() - 0.5) * 2 * jitterScale,
      );
      const m = bubble.tailCurve ?? 0.5;
      ctx.quadraticCurveTo(
        geo.baseAx + (geo.tipX - geo.baseAx) * m + (rFill() - 0.5) * 4 * jitterScale,
        geo.baseAy + (geo.tipY - geo.baseAy) * m,
        geo.tipX + (rFill() - 0.5) * 3 * jitterScale,
        geo.tipY + (rFill() - 0.5) * 2 * jitterScale,
      );
      ctx.quadraticCurveTo(
        geo.baseBx + (geo.tipX - geo.baseBx) * m + (rFill() - 0.5) * 4 * jitterScale,
        geo.baseBy + (geo.tipY - geo.baseBy) * m,
        geo.baseBx + (rFill() - 0.5) * 3 * jitterScale,
        geo.baseBy + (rFill() - 0.5) * 2 * jitterScale,
      );
    } else {
      ctx.moveTo(geo.baseAx, geo.baseAy);
      ctx.lineTo(geo.tipX, geo.tipY);
      ctx.lineTo(geo.baseBx, geo.baseBy);
    }
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.lineWidth = sw;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#222";
    if (style === "handwritten") {
      const m = bubble.tailCurve ?? 0.5;
      ctx.beginPath();
      ctx.moveTo(geo.baseAx + (r2() - 0.5) * 3 * jitterScale, geo.baseAy + (r2() - 0.5) * 2 * jitterScale);
      ctx.quadraticCurveTo(
        geo.baseAx + (geo.tipX - geo.baseAx) * m + (r2() - 0.5) * 4 * jitterScale,
        geo.baseAy + (geo.tipY - geo.baseAy) * m,
        geo.tipX + (r2() - 0.5) * 3 * jitterScale,
        geo.tipY + (r2() - 0.5) * 2 * jitterScale,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(geo.tipX + (r2() - 0.5) * 3 * jitterScale, geo.tipY + (r2() - 0.5) * 2 * jitterScale);
      ctx.quadraticCurveTo(
        geo.baseBx + (geo.tipX - geo.baseBx) * m + (r2() - 0.5) * 4 * jitterScale,
        geo.baseBy + (geo.tipY - geo.baseBy) * m,
        geo.baseBx + (r2() - 0.5) * 3 * jitterScale,
        geo.baseBy + (r2() - 0.5) * 2 * jitterScale,
      );
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(geo.baseAx, geo.baseAy);
      ctx.lineTo(geo.tipX, geo.tipY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(geo.tipX, geo.tipY);
      ctx.lineTo(geo.baseBx, geo.baseBy);
      ctx.stroke();
    }
  }

  if (hasDots) {
    const cx2 = x + w / 2,
      cy2 = y + h / 2;
    const isHw = bubble.tailStyle === "dots_handwritten";
    const defaultTip = getDefaultTailTip(bubble);
    const dotTipX = bubble.tailTipX ?? defaultTip.x;
    const dotTipY = bubble.tailTipY ?? defaultTip.y;
    const dotAngle = Math.atan2(dotTipY - cy2, dotTipX - cx2);
    const startX = cx2 + Math.cos(dotAngle) * (w / 2) + Math.cos(dotAngle) * 5;
    const startY = cy2 + Math.sin(dotAngle) * (h / 2) + Math.sin(dotAngle) * 5;
    const dirX = Math.cos(dotAngle);
    const dirY = Math.sin(dotAngle);
    const scale = bubble.dotsScale ?? 1;
    const spacing = bubble.dotsSpacing ?? 1;
    [
      { size: 8 * scale, dist: 12 * spacing },
      { size: 6 * scale, dist: 26 * spacing },
      { size: 4 * scale, dist: 38 * spacing },
    ].forEach(({ size, dist }) => {
      const jitterScale = bubble.tailJitter ?? 1;
      const dx = startX + dirX * dist + (isHw ? (rand() - 0.5) * 4 * jitterScale : 0);
      const dy = startY + dirY * dist + (isHw ? (rand() - 0.5) * 4 * jitterScale : 0);
      ctx.beginPath();
      if (isHw) {
        const segs = 12;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const px = dx + Math.cos(a) * size + (rand() - 0.5) * 2 * jitterScale;
          const py = dy + Math.sin(a) * size + (rand() - 0.5) * 2 * jitterScale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(dx, dy, size, 0, Math.PI * 2);
      }
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = sw * 0.8;
      ctx.stroke();
    });
  }

  if (bubble.text) {
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${bubble.fontSize}px ${getFontFamily(bubble.fontKey)}`;
    const padding = 10;
    const maxTextW = w - padding * 2;
    const rawLines = bubble.text.split("\n");
    const wrappedLines: string[] = [];
    rawLines.forEach((rawLine) => {
      if (!rawLine) {
        wrappedLines.push("");
        return;
      }
      let current = "";
      for (const ch of rawLine) {
        const test = current + ch;
        if (ctx.measureText(test).width > maxTextW && current) {
          wrappedLines.push(current);
          current = ch;
        } else {
          current = test;
        }
      }
      if (current) wrappedLines.push(current);
    });
    const lh = bubble.fontSize * 1.3;
    const totalH = wrappedLines.length * lh;
    const startY = y + h / 2 - totalH / 2 + lh / 2;
    wrappedLines.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, startY + i * lh);
    });
  }

  if (isSelected) {
    ctx.strokeStyle = "hsl(240, 80%, 60%)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.setLineDash([]);
    const hs = 8;
    [
      { hx: x - 4, hy: y - 4 },
      { hx: x + w / 2, hy: y - 4 },
      { hx: x + w + 4, hy: y - 4 },
      { hx: x + w + 4, hy: y + h / 2 },
      { hx: x + w + 4, hy: y + h + 4 },
      { hx: x + w / 2, hy: y + h + 4 },
      { hx: x - 4, hy: y + h + 4 },
      { hx: x - 4, hy: y + h / 2 },
    ].forEach((handle) => {
      ctx.fillStyle = "white";
      ctx.fillRect(handle.hx - hs / 2, handle.hy - hs / 2, hs, hs);
      ctx.strokeStyle = "hsl(240, 80%, 60%)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(handle.hx - hs / 2, handle.hy - hs / 2, hs, hs);
    });

    if (bubble.tailStyle !== "none") {
      const geo = getTailGeometry(bubble);
      ctx.beginPath();
      ctx.arc(geo.tipX, geo.tipY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(340, 80%, 55%)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
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
  const bw = Math.min(metrics.width + padX * 2, canvasW - 16);
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

  // resize handle (bottom-right)
  const handleSize = 8;
  const hx = bx + bw - 6;
  const hy = by + bh - 6;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "hsl(210, 80%, 50%)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  ctx.fill();
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
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
          ctx.drawImage(ch.imageEl, ch.x - w / 2, ch.y - h / 2, w, h);
          if (ch.id === selectedCharIdRef.current) {
            const bx = ch.x - w / 2 - 3;
            const by = ch.y - h / 2 - 3;
            const bw = w + 6;
            const bh = h + 6;
            ctx.strokeStyle = "hsl(150, 80%, 40%)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);
            const handleSize = 8;
            const corners = [
              { hx: bx, hy: by },
              { hx: bx + bw, hy: by },
              { hx: bx, hy: by + bh },
              { hx: bx + bw, hy: by + bh },
            ];
            corners.forEach(({ hx, hy }) => {
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "hsl(150, 80%, 40%)";
              ctx.lineWidth = 2;
              ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
              ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
            });
          }
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
  }, []);

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
        if (selB) {
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
        if (selCh && selCh.imageEl) {
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

      if (mode === "move-tail") {
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
          setEditingBubbleId(b.id);
          return;
        }
      }
    },
    [getCanvasPos, onSelectBubble],
  );

  const hasZoom = zoom !== undefined;
  const zoomScale = (zoom ?? 100) / 100;

  return (
    <div
      ref={canvasWrapperRef}
      className="relative inline-block shrink-0"
      style={hasZoom ? {
        width: CANVAS_W * zoomScale,
        height: CANVAS_H * zoomScale,
      } : undefined}
    >
      <canvas
        ref={(el) => {
          (canvasRef as any).current = el;
          externalCanvasRef?.(el);
        }}
        width={CANVAS_W}
        height={CANVAS_H}
        style={hasZoom ? {
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        } : {
          maxWidth: "100%",
          height: "auto",
          display: "block",
          touchAction: "none",
        }}
        className="rounded-md border border-border"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        data-testid="panel-canvas"
      />
      {editingBubbleId &&
        (() => {
          const eb = panel.bubbles.find((b) => b.id === editingBubbleId);
          if (!eb || !canvasRef.current) return null;
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / CANVAS_W;
          const scaleY = rect.height / CANVAS_H;
          const fontEntry = KOREAN_FONTS.find((f) => f.value === eb.fontKey);
          return (
            <textarea
              autoFocus
              className="absolute border-2 border-primary rounded bg-white/90 dark:bg-black/80 p-1 resize-none outline-none"
              style={{
                left: eb.x * scaleX,
                top: eb.y * scaleY,
                width: eb.width * scaleX,
                height: eb.height * scaleY,
                fontSize: eb.fontSize * scaleX,
                fontFamily: fontEntry?.family || "sans-serif",
                textAlign: "center",
                lineHeight: 1.3,
                color: "black",
              }}
              value={eb.text}
              onChange={(e) =>
                updateBubbleInPanel(eb.id, { text: e.target.value })
              }
              onBlur={() => setEditingBubbleId(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingBubbleId(null);
              }}
              data-testid="input-inline-bubble-text"
            />
          );
        })()}
    </div>
  );
}

function RightSidebar({
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
}) {
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [showBubbleTemplatePicker, setShowBubbleTemplatePicker] = useState(false);
  const [templateCatIdx, setTemplateCatIdx] = useState(0);
  const [limitOpen, setLimitOpen] = useState(false);
  const { toast } = useToast();

  const canBubbleEdit = true;
  const canAllFonts = isPro || creatorTier >= 3;
  const availableFonts = canAllFonts ? KOREAN_FONTS : KOREAN_FONTS.slice(0, 3);

  const selectedBubble =
    panel.bubbles.find((b) => b.id === selectedBubbleId) || null;

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

  const addBubble = () => {
    if (!canBubbleEdit) return;
    const used = getDailyCount("story-bubble");
    if (used >= 3) {
      setLimitOpen(true);
      return;
    }
    if (panel.bubbles.length >= 5) return;
    const newB = createBubble(CANVAS_W, CANVAS_H);
    incDailyCount("story-bubble");
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
    const used = getDailyCount("story-bubble");
    if (used >= 3) {
      setLimitOpen(true);
      return;
    }
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
      incDailyCount("story-bubble");
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
    return items.sort((a, b) => a.z - b.z);
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

  return (
    <div className="space-y-5" data-testid={`panel-editor-${index}`}>
      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용 제한 안내</DialogTitle>
            <DialogDescription>3회이상 사용이 제한됐어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setLimitOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex gap-1 flex-wrap">
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowBubbleTemplatePicker(true)}
          disabled={!canBubbleEdit || panel.bubbles.length >= 5}
          data-testid={`button-bubble-templates-${index}`}
        >
          <Layers className="h-3.5 w-3.5 mr-1" />
          템플릿
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCharPicker(!showCharPicker)}
          data-testid={`button-add-character-${index}`}
        >
          <ImageIcon className="h-3.5 w-3.5 mr-1" />
          캐릭터
        </Button>
      </div>

      {showCharPicker && (
        <div className="rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">캐릭터 선택</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCharPicker(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
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
              className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                item.type === "char"
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

      {selectedBubble && (
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
                      프로 연재러(30회+) 등급에서 전체 폰트 해금
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] mb-1 block">스타일</Label>
              <Select
                value={selectedBubble.style}
                onValueChange={(v) =>
                  updateBubble(selectedBubble.id, {
                    style: v as BubbleStyle,
                    seed: Math.floor(Math.random() * 1000000),
                  })
                }
              >
                <SelectTrigger data-testid="select-bubble-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STYLE_LABELS).filter(([k]) => k !== "image").map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[13px] mb-1 block">말꼬리</Label>
              <Select
                value={selectedBubble.tailStyle}
                onValueChange={(v) =>
                  updateBubble(selectedBubble.id, { tailStyle: v as TailStyle })
                }
              >
                <SelectTrigger data-testid="select-tail-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAIL_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBubble.tailStyle !== "none" && (
              <div>
                <Label className="text-[13px] mb-1 block">방향</Label>
                <Select
                  value={selectedBubble.tailDirection}
                  onValueChange={(v) =>
                    updateBubble(selectedBubble.id, {
                      tailDirection: v as SpeechBubble["tailDirection"],
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
            )}
            {selectedBubble.tailStyle !== "none" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-[13px] mb-1 block">말꼬리 길이</Label>
                  <Slider
                    value={[selectedBubble.tailLength ?? (selectedBubble.tailStyle === "long" ? 50 : 25)]}
                    onValueChange={([v]) =>
                      updateBubble(selectedBubble.id, { tailLength: v })
                    }
                    min={10}
                    max={120}
                    step={2}
                    data-testid="slider-tail-length"
                  />
                </div>
                <div>
                  <Label className="text-[13px] mb-1 block">말꼬리 폭</Label>
                  <Slider
                    value={[selectedBubble.tailBaseSpread ?? 8]}
                    onValueChange={([v]) =>
                      updateBubble(selectedBubble.id, { tailBaseSpread: v })
                    }
                    min={4}
                    max={20}
                    step={1}
                    data-testid="slider-tail-spread"
                  />
                </div>
                <div>
                  <Label className="text-[13px] mb-1 block">곡률</Label>
                  <Slider
                    value={[selectedBubble.tailCurve ?? 0.5]}
                    onValueChange={([v]) =>
                      updateBubble(selectedBubble.id, { tailCurve: v })
                    }
                    min={0.2}
                    max={0.8}
                    step={0.02}
                    data-testid="slider-tail-curve"
                  />
                </div>
                <div>
                  <Label className="text-[13px] mb-1 block">랜덤 흔들림</Label>
                  <Slider
                    value={[selectedBubble.tailJitter ?? 1]}
                    onValueChange={([v]) =>
                      updateBubble(selectedBubble.id, { tailJitter: v })
                    }
                    min={0}
                    max={2}
                    step={0.1}
                    data-testid="slider-tail-jitter"
                  />
                </div>
                {selectedBubble.tailStyle.startsWith("dots_") && (
                  <>
                    <div>
                      <Label className="text-[13px] mb-1 block">점 크기 배율</Label>
                      <Slider
                        value={[selectedBubble.dotsScale ?? 1]}
                        onValueChange={([v]) =>
                          updateBubble(selectedBubble.id, { dotsScale: v })
                        }
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        data-testid="slider-dots-scale"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] mb-1 block">점 간격 배율</Label>
                      <Slider
                        value={[selectedBubble.dotsSpacing ?? 1]}
                        onValueChange={([v]) =>
                          updateBubble(selectedBubble.id, { dotsSpacing: v })
                        }
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        data-testid="slider-dots-spacing"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <Label className="text-[13px]">글자 크기</Label>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {selectedBubble.fontSize}px
              </span>
            </div>
            <Slider
              value={[selectedBubble.fontSize]}
              onValueChange={([v]) =>
                updateBubble(selectedBubble.id, { fontSize: v })
              }
              min={8}
              max={40}
              step={1}
              data-testid="slider-font-size"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <Label className="text-[13px]">테두리 두께</Label>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {selectedBubble.strokeWidth}px
              </span>
            </div>
            <Slider
              value={[selectedBubble.strokeWidth]}
              onValueChange={([v]) =>
                updateBubble(selectedBubble.id, { strokeWidth: v })
              }
              min={1}
              max={5}
              step={0.5}
              data-testid="slider-stroke-width"
            />
          </div>
        </div>
      )}

      {!selectedBubble && panel.bubbles.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px] font-medium text-muted-foreground">
              말풍선 ({panel.bubbles.length})
            </span>
          </div>
          {panel.bubbles.map((b, bi) => (
            <div
              key={b.id}
              className={`flex items-center justify-between gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors ${b.id === selectedBubbleId ? "bg-primary/10" : "hover-elevate"}`}
              onClick={() => {
                setSelectedBubbleId(b.id);
                setSelectedCharId(null);
              }}
              data-testid={`row-bubble-${bi}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {b.style === "image" && b.templateSrc ? (
                  <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img src={b.templateSrc} alt="" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-[12px] shrink-0">
                    {bi + 1}
                  </Badge>
                )}
                <span className="text-sm truncate">
                  {b.text || STYLE_LABELS[b.style]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBubble(b.id);
                }}
                data-testid={`button-delete-bubble-${bi}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showBubbleTemplatePicker && (
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
      )}
    </div>
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
  const [panels, setPanelsRaw] = useState<PanelData[]>([createPanel()]);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [fontsInjected, setFontsInjected] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
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

  const clonePanels = useCallback((src: PanelData[]): PanelData[] => {
    return src.map((p) => ({
      ...p,
      bubbles: p.bubbles.map((b) => ({ ...b })),
      characters: p.characters.map((c) => ({ ...c })),
      topScript: p.topScript ? { ...p.topScript } : null,
      bottomScript: p.bottomScript ? { ...p.bottomScript } : null,
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
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const fitToView = useCallback(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const areaW = area.clientWidth - 48;
    const areaH = area.clientHeight - 48;
    if (areaW <= 0 || areaH <= 0) return;
    const fitScale = Math.min(areaW / CANVAS_W, areaH / CANVAS_H, 2);
    setZoom(Math.round(fitScale * 100));
  }, []);

  useEffect(() => {
    fitToView();
  }, []);

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
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoom((z) => Math.min(200, z + 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(20, z - 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        fitToView();
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

  const { data: usageData } = useQuery<UsageData>({ queryKey: ["/api/usage"] });
  const maxPanels = usageData?.maxStoryPanels ?? 3;
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (!fontsInjected) {
      const style = document.createElement("style");
      style.textContent = FONT_CSS;
      document.head.appendChild(style);
      setFontsInjected(true);
      if (document.fonts && typeof document.fonts.ready?.then === "function") {
        document.fonts.ready.then(() => {
          setFontsReady(true);
        }).catch(() => {
          setFontsReady(true);
        });
      } else {
        setFontsReady(true);
      }
    }
  }, [fontsInjected]);

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
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/story-scripts", {
        topic,
        panelCount: panels.length,
      });
      return res.json() as Promise<{ panels: StoryPanelScript[] }>;
    },
    onSuccess: (data) => {
      incDailyCount("story-ai");
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
      if (/^403: /.test(error.message)) {
        setAiLimitOpen(true);
        toast({
          title: "AI 생성 제한",
          description: "오늘 무료 AI 생성 3회를 초과했습니다.",
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

  type LeftTab = "ai" | "panels" | "edit" | "script" | null;
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>("panels");

  const toggleLeftTab = (tab: LeftTab) => {
    setActiveLeftTab((prev) => (prev === tab ? null : tab));
  };

  const downloadPanel = (idx: number) => {
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
    { id: "ai", icon: Wand2, label: "AI 생성" },
    { id: "panels", icon: Layers, label: "패널" },
    { id: "script", icon: Type, label: "스크립트" },
    { id: "edit", icon: Settings2, label: "편집" },
  ];

  return (
    <div className="editor-page h-[calc(100vh-3.5rem)] flex overflow-hidden bg-muted/30 dark:bg-background relative">
      <EditorOnboarding editor="story" />
      <div
        className="flex shrink-0 bg-card dark:bg-card"
        data-testid="left-icon-sidebar"
      >
        <div className="flex flex-col items-center py-3 px-1.5 gap-5 w-[56px]">
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

        {activeLeftTab && (
          <div
            className="w-[260px] bg-card overflow-y-auto"
            data-testid="left-panel-content"
          >
            <div className="p-3 space-y-5">
              {activeLeftTab === "ai" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">AI 자막 생성</h3>
                    <button
                      onClick={() => setActiveLeftTab(null)}
                      className="text-muted-foreground hover-elevate rounded-md p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                    const used = getDailyCount("story-ai");
                    if (used >= 3) {
                      setAiLimitOpen(true);
                      return;
                    }
                    generateMutation.mutate();
                  }}
                    disabled={!topic.trim() || generateMutation.isPending}
                    data-testid="button-generate-scripts"
                  >
                    {generateMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    AI 자막 생성
                  </Button>
                </>
              )}

              {activeLeftTab === "panels" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">패널 목록</h3>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="text-[11px]"
                        data-testid="badge-story-panel-count"
                      >
                        {panels.length}개
                      </Badge>
                      <button
                        onClick={() => setActiveLeftTab(null)}
                        className="text-muted-foreground hover-elevate rounded-md p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {panels.map((panel, i) => (
                      <div
                        key={panel.id}
                        className={`rounded-lg border-2 transition-colors cursor-pointer overflow-hidden ${i === activePanelIndex ? "border-primary/50" : "border-border hover-elevate"}`}
                        onClick={() => {
                          setActivePanelIndex(i);
                          setSelectedBubbleId(null);
                          setSelectedCharId(null);
                        }}
                        data-testid={`panel-card-${i}`}
                      >
                        <div className="flex items-center justify-between px-2 py-1 bg-muted/50">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {i + 1}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadPanel(i);
                              }}
                              data-testid={`button-download-panel-${i}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicatePanel(i);
                              }}
                              disabled={panels.length >= maxPanels}
                              data-testid={`button-duplicate-panel-${i}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {panels.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePanel(i);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-1.5">
                          <PanelCanvas
                            key={panel.id + "-thumb"}
                            panel={panel}
                            onUpdate={(updated) => updatePanel(i, updated)}
                            selectedBubbleId={null}
                            onSelectBubble={() => {}}
                            selectedCharId={null}
                            onSelectChar={() => {}}
                            canvasRef={() => {}}
            fontsReady={fontsReady}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addPanel}
                    disabled={panels.length >= maxPanels}
                    data-testid="button-add-panel"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    페이지 추가 ({panels.length}/{maxPanels})
                  </Button>
                </>
              )}

              {activeLeftTab === "script" && activePanel && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">스크립트</h3>
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
                      variant={activePanel.topScript ? "secondary" : "outline"}
                      onClick={() => {
                        const p = activePanel;
                        updatePanel(activePanelIndex, {
                          ...p,
                          topScript: p.topScript
                            ? null
                            : { text: "", style: "no-bg", color: "yellow" },
                        });
                      }}
                      data-testid={`button-toggle-top-script-${activePanelIndex}`}
                    >
                      <AlignVerticalJustifyStart className="h-3.5 w-3.5 mr-1" />
                      상단
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        activePanel.bottomScript ? "secondary" : "outline"
                      }
                      onClick={() => {
                        const p = activePanel;
                        updatePanel(activePanelIndex, {
                          ...p,
                          bottomScript: p.bottomScript
                            ? null
                            : { text: "", style: "no-bg", color: "sky" },
                        });
                      }}
                      data-testid={`button-toggle-bottom-script-${activePanelIndex}`}
                    >
                      <AlignVerticalJustifyEnd className="h-3.5 w-3.5 mr-1" />
                      하단
                    </Button>
                  </div>

                  {activePanel.topScript && (
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
                            {KOREAN_FONTS.map((f) => (
                              <SelectItem key={f.value} value={f.value} className="text-[11px]">
                                {f.label}
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

                  {activePanel.bottomScript && (
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
                            {KOREAN_FONTS.map((f) => (
                              <SelectItem key={f.value} value={f.value} className="text-[11px]">
                                {f.label}
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

              {activeLeftTab === "edit" && activePanel && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">편집</h3>
                    <button
                      onClick={() => setActiveLeftTab(null)}
                      className="text-muted-foreground hover-elevate rounded-md p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <RightSidebar
                    key={activePanel.id}
                    panel={activePanel}
                    index={activePanelIndex}
                    total={panels.length}
                    onUpdate={(updated) =>
                      updatePanel(activePanelIndex, updated)
                    }
                    onRemove={() => removePanel(activePanelIndex)}
                    galleryImages={galleryData || []}
                    galleryLoading={galleryLoading}
                    selectedBubbleId={selectedBubbleId}
                    setSelectedBubbleId={setSelectedBubbleId}
                    selectedCharId={selectedCharId}
                    setSelectedCharId={setSelectedCharId}
                    creatorTier={usageData?.creatorTier ?? 0}
                    isPro={usageData?.tier === "pro"}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

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

        <div
          ref={canvasAreaRef}
          className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6 bg-muted/20 dark:bg-muted/10"
          data-testid="story-canvas-area"
        >
          {activePanel && (
            <div className="shrink-0" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", borderRadius: "12px" }}>
              <PanelCanvas
                key={activePanel.id + "-main"}
                panel={activePanel}
                onUpdate={(updated) => updatePanel(activePanelIndex, updated)}
                selectedBubbleId={selectedBubbleId}
                onSelectBubble={(id) => {
                  setSelectedBubbleId(id);
                  setSelectedCharId(null);
                }}
                selectedCharId={selectedCharId}
                onSelectChar={(id) => {
                  setSelectedCharId(id);
                  setSelectedBubbleId(null);
                }}
                canvasRef={(el) => {
                  if (el) panelCanvasRefs.current.set(activePanel.id, el);
                }}
                zoom={zoom}
                fontsReady={fontsReady}
              />
            </div>
          )}
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

      <Dialog open={aiLimitOpen} onOpenChange={setAiLimitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">AI 생성 제한</DialogTitle>
            <DialogDescription>오늘 무료 AI 생성 3회를 초과했습니다.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full gap-1.5" data-testid="button-upgrade-pro-ai">
              <a href="/pricing">Pro 업그레이드</a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setAiLimitOpen(false)} data-testid="button-close-ai-limit">닫기</Button>
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
                <Button
                  variant="outline"
                  onClick={() => handleShareInstagram(activePanelIndex)}
                  className="gap-1.5 w-full"
                  data-testid="button-modal-story-instagram"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Instagram
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
                <Button
                  variant="outline"
                  onClick={() => handleShareInstagram(activePanelIndex)}
                  className="gap-1.5 w-full"
                  data-testid="button-modal-story-instagram-free"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Instagram
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
