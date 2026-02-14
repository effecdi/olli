import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, Plus, Trash2, MessageCircle, ArrowRight, Type, Move, Maximize2, ImagePlus, X, Loader2, Layers, ChevronUp, ChevronDown, Save, Minimize2, ZoomIn, ZoomOut, FolderOpen, Share2, Crown, Lightbulb } from "lucide-react";
import { EditorOnboarding } from "@/components/editor-onboarding";
import { useLocation } from "wouter";

function bubblePath(n: number) {
  return `/assets/bubbles/bubble_${String(n).padStart(3, "0")}.png`;
}

type TemplateCategory = { label: string; ids: number[] };

const BUBBLE_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    label: "말풍선 (외침/효과)",
    ids: [109, 110, 111, 112, 113],
  },
  {
    label: "이펙트 / 스티커",
    ids: [108, 114, 115, 116, 117],
  },
];

type BubbleStyle = "handwritten" | "linedrawing" | "wobbly" | "thought" | "shout" | "rectangle" | "rounded" | "doubleline" | "wavy" | "image";
type TailStyle = "none" | "long" | "short" | "dots_handwritten" | "dots_linedrawing";

const KOREAN_FONTS = [
  { value: "default", label: "기본 고딕", family: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" },
  { value: "NanumPen", label: "나눔손글씨 펜", family: "'NanumPen', cursive" },
  { value: "NanumBrush", label: "나눔손글씨 붓", family: "'NanumBrush', cursive" },
  { value: "KyoboHand", label: "교보손글씨", family: "'KyoboHand', cursive" },
  { value: "DaraeHand", label: "다래손글씨", family: "'DaraeHand', cursive" },
  { value: "KotraHand", label: "코트라 손글씨", family: "'KotraHand', cursive" },
  { value: "Haesom", label: "온글잎 해솜", family: "'Haesom', cursive" },
  { value: "GowunDodum", label: "고운 도둠", family: "'GowunDodum', sans-serif" },
  { value: "MitmiFont", label: "온글잎 밋미", family: "'MitmiFont', cursive" },
  { value: "Hanna", label: "배민 한나", family: "'Hanna', sans-serif" },
  { value: "KCCGanpan", label: "KCC 간판체", family: "'KCCGanpan', sans-serif" },
  { value: "KCCEunyoung", label: "KCC 은영체", family: "'KCCEunyoung', cursive" },
  { value: "KCCKimhun", label: "KCC 김훈체", family: "'KCCKimhun', cursive" },
  { value: "Dovemayo", label: "도브메이요", family: "'Dovemayo', sans-serif" },
  { value: "HakgyoansimDoldamM", label: "학교안심 돌담", family: "'HakgyoansimDoldamM', sans-serif" },
  { value: "LeeSeoyun", label: "이서윤체", family: "'LeeSeoyun', cursive" },
  { value: "UhBeeSeHyun", label: "어비 세현체", family: "'UhBeeSeHyun', cursive" },
  { value: "Stylish", label: "나눔 스타일리시", family: "'Stylish', cursive" },
  { value: "GangwonEdu", label: "강원교육체", family: "'GangwonEdu', sans-serif" },
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
@font-face { font-family: 'KCCEunyoung'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCEunyoung.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'KCCKimhun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/KCCKimhun.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'Dovemayo'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/Dovemayo.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'HakgyoansimDoldamM'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/HakgyoansimDoldamM.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'LeeSeoyun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2104@1.0/LeeSeoyun.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'UhBeeSeHyun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_five@1.0/UhBeeSeHyun.woff') format('woff'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'Stylish'; src: url('https://fonts.gstatic.com/s/stylish/v22/m8JTjfNPYbmjEnNbyeLuEYw.woff2') format('woff2'); font-weight: normal; font-display: swap; }
@font-face { font-family: 'GangwonEdu'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2201-2@1.0/GangwonEdu_OTFBoldA.woff') format('woff'); font-weight: normal; font-display: swap; }
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

interface CharacterOverlay {
  id: string;
  imageUrl: string;
  imgElement: HTMLImageElement | null;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  label: string;
  zIndex?: number;
}

type DragMode = null | "move" | "move-tail" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "resize-r" | "resize-l" | "resize-t" | "resize-b"
  | "char-move" | "char-resize-br" | "char-resize-bl" | "char-resize-tr" | "char-resize-tl";

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

function drawHandwrittenPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
  const segments = 60;
  const rand = seededRandom(seed);

  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jitterX = (rand() - 0.5) * strokeWidth * 1.5;
    const jitterY = (rand() - 0.5) * strokeWidth * 1.5;
    const px = cx + Math.cos(angle) * rx + jitterX;
    const py = cy + Math.sin(angle) * ry + jitterY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawLinedrawingPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function drawWobblyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, wobble: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
  const segments = 80;

  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobbleX = Math.sin(angle * 6) * wobble;
    const wobbleY = Math.cos(angle * 8) * wobble * 0.7;
    const px = cx + Math.cos(angle) * (rx + wobbleX);
    const py = cy + Math.sin(angle) * (ry + wobbleY);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawThoughtPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
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

function drawShoutPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "miter";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
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

function drawRectanglePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.closePath();
}

function drawRoundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
  ctx.lineWidth = strokeWidth;
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

function drawDoublelinePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();

  const gap = strokeWidth * 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - gap, ry - gap, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function drawWavyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
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

function getDefaultTailTip(bubble: SpeechBubble) {
  const cx = bubble.x + bubble.width / 2;
  const cy = bubble.y + bubble.height / 2;
  const styleLen = bubble.tailStyle === "long" || bubble.tailStyle === "dots_handwritten" || bubble.tailStyle === "dots_linedrawing" ? 50 : 25;
  const tailLen = bubble.tailLength ?? styleLen;
  switch (bubble.tailDirection) {
    case "bottom": return { x: cx + 10, y: bubble.y + bubble.height + tailLen };
    case "top": return { x: cx + 10, y: bubble.y - tailLen };
    case "left": return { x: bubble.x - tailLen, y: cy + 10 };
    case "right": return { x: bubble.x + bubble.width + tailLen, y: cy + 10 };
  }
}

function getTailGeometry(bubble: SpeechBubble) {
  const cx = bubble.x + bubble.width / 2;
  const cy = bubble.y + bubble.height / 2;
  const defaultTip = getDefaultTailTip(bubble);
  const tipX = bubble.tailTipX ?? defaultTip.x;
  const tipY = bubble.tailTipY ?? defaultTip.y;

  const angle = Math.atan2(tipY - cy, tipX - cx);
  const perpAngle = angle + Math.PI / 2;
  const baseSpread = bubble.tailBaseSpread ?? 8;

  const edgeX = cx + Math.cos(angle) * (bubble.width / 2);
  const edgeY = cy + Math.sin(angle) * (bubble.height / 2);

  const baseAx = edgeX + Math.cos(perpAngle) * baseSpread;
  const baseAy = edgeY + Math.sin(perpAngle) * baseSpread;
  const baseBx = edgeX - Math.cos(perpAngle) * baseSpread;
  const baseBy = edgeY - Math.sin(perpAngle) * baseSpread;

  const tailLen = Math.sqrt((tipX - cx) ** 2 + (tipY - cy) ** 2);

  return { tipX, tipY, baseAx, baseAy, baseBx, baseBy, tailLen };
}

function drawBubble(ctx: CanvasRenderingContext2D, bubble: SpeechBubble, isSelected: boolean) {
  ctx.save();

  const { x, y, width: w, height: h, style, strokeWidth: sw, wobble: wob, seed } = bubble;
  const hasTail = bubble.tailStyle === "long" || bubble.tailStyle === "short";
  const hasDots = bubble.tailStyle === "dots_handwritten" || bubble.tailStyle === "dots_linedrawing";
  const rand = seededRandom(seed + 1000);

  const isDoubleLine = style === "doubleline";
  const isImage = style === "image";

  if (isImage && bubble.templateImg) {
    ctx.drawImage(bubble.templateImg, x, y, w, h);
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
    const rand2 = seededRandom(seed + 1000);
    const jitterScale = bubble.tailJitter ?? 1;

    ctx.beginPath();
    if (bubble.style === "handwritten") {
      const rFill = seededRandom(seed + 1000);
      ctx.moveTo(geo.baseAx + (rFill() - 0.5) * 3 * jitterScale, geo.baseAy + (rFill() - 0.5) * 2 * jitterScale);
      const m = bubble.tailCurve ?? 0.5;
      ctx.quadraticCurveTo(geo.baseAx + (geo.tipX - geo.baseAx) * m + (rFill() - 0.5) * 4 * jitterScale, geo.baseAy + (geo.tipY - geo.baseAy) * m, geo.tipX + (rFill() - 0.5) * 3 * jitterScale, geo.tipY + (rFill() - 0.5) * 2 * jitterScale);
      ctx.quadraticCurveTo(geo.baseBx + (geo.tipX - geo.baseBx) * m + (rFill() - 0.5) * 4 * jitterScale, geo.baseBy + (geo.tipY - geo.baseBy) * m, geo.baseBx + (rFill() - 0.5) * 3 * jitterScale, geo.baseBy + (rFill() - 0.5) * 2 * jitterScale);
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

    if (bubble.style === "handwritten") {
      const r = rand2;
      const midFactor = bubble.tailCurve ?? 0.5;

      ctx.beginPath();
      ctx.moveTo(geo.baseAx + (r() - 0.5) * 3 * jitterScale, geo.baseAy + (r() - 0.5) * 2 * jitterScale);
      const midX1 = geo.baseAx + (geo.tipX - geo.baseAx) * midFactor + (r() - 0.5) * 4 * jitterScale;
      const midY1 = geo.baseAy + (geo.tipY - geo.baseAy) * midFactor;
      ctx.quadraticCurveTo(midX1, midY1, geo.tipX + (r() - 0.5) * 3 * jitterScale, geo.tipY + (r() - 0.5) * 2 * jitterScale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(geo.tipX + (r() - 0.5) * 3 * jitterScale, geo.tipY + (r() - 0.5) * 2 * jitterScale);
      const midX2 = geo.baseBx + (geo.tipX - geo.baseBx) * midFactor + (r() - 0.5) * 4 * jitterScale;
      const midY2 = geo.baseBy + (geo.tipY - geo.baseBy) * midFactor;
      ctx.quadraticCurveTo(midX2, midY2, geo.baseBx + (r() - 0.5) * 3 * jitterScale, geo.baseBy + (r() - 0.5) * 2 * jitterScale);
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
    const cx2 = bubble.x + bubble.width / 2;
    const cy2 = bubble.y + bubble.height / 2;
    const isHandwritten = bubble.tailStyle === "dots_handwritten";
    const defaultTip = getDefaultTailTip(bubble);
    const dotTipX = bubble.tailTipX ?? defaultTip.x;
    const dotTipY = bubble.tailTipY ?? defaultTip.y;
    const dotAngle = Math.atan2(dotTipY - cy2, dotTipX - cx2);
    const startX = cx2 + Math.cos(dotAngle) * (bubble.width / 2) + Math.cos(dotAngle) * 5;
    const startY = cy2 + Math.sin(dotAngle) * (bubble.height / 2) + Math.sin(dotAngle) * 5;
    const dirX = Math.cos(dotAngle);
    const dirY = Math.sin(dotAngle);

    const scale = bubble.dotsScale ?? 1;
    const spacing = bubble.dotsSpacing ?? 1;
    const dots = [
      { size: 8 * scale, dist: 12 * spacing },
      { size: 6 * scale, dist: 26 * spacing },
      { size: 4 * scale, dist: 38 * spacing },
    ];

    dots.forEach(({ size, dist }) => {
      const jitterScale = bubble.tailJitter ?? 1;
      const dx = startX + dirX * dist + (isHandwritten ? (rand() - 0.5) * 4 * jitterScale : 0);
      const dy = startY + dirY * dist + (isHandwritten ? (rand() - 0.5) * 4 * jitterScale : 0);
      ctx.beginPath();
      if (isHandwritten) {
        const segments = 12;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const jx = (rand() - 0.5) * 2 * jitterScale;
          const jy = (rand() - 0.5) * 2 * jitterScale;
          const px = dx + Math.cos(angle) * size + jx;
          const py = dy + Math.sin(angle) * size + jy;
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
      if (!rawLine) { wrappedLines.push(""); return; }
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
    const lineHeight = bubble.fontSize * 1.3;
    const totalHeight = wrappedLines.length * lineHeight;
    const textStartY = y + h / 2 - totalHeight / 2 + lineHeight / 2;
    wrappedLines.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, textStartY + i * lineHeight);
    });
  }

  if (isSelected) {
    ctx.strokeStyle = "hsl(240, 80%, 60%)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.setLineDash([]);

    const handleSize = 8;
    const handles = [
      { x: x - 4, y: y - 4 },
      { x: x + w / 2, y: y - 4 },
      { x: x + w + 4, y: y - 4 },
      { x: x + w + 4, y: y + h / 2 },
      { x: x + w + 4, y: y + h + 4 },
      { x: x + w / 2, y: y + h + 4 },
      { x: x - 4, y: y + h + 4 },
      { x: x - 4, y: y + h / 2 },
    ];

    handles.forEach((handle) => {
      ctx.fillStyle = "white";
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeStyle = "hsl(240, 80%, 60%)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
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

const STYLE_LABELS: Record<BubbleStyle, string> = {
  linedrawing: "심플 라인",
  handwritten: "손글씨",
  rounded: "둥근 사각형",
  rectangle: "사각형",
  thought: "생각 구름",
  shout: "외침 / 효과",
  wobbly: "불안한 말풍선",
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

export default function BubblePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragModeRef = useRef<DragMode>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragBubbleStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const selectedIdRef = useRef<string | null>(null);
  const bubblesRef = useRef<SpeechBubble[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 522, height: 695 });
  const [fontsInjected, setFontsInjected] = useState(false);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const getMaxZoom = useCallback(() => 200, []);

  const [characterOverlays, setCharacterOverlays] = useState<CharacterOverlay[]>([]);
  const characterOverlaysRef = useRef<CharacterOverlay[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const selectedCharIdRef = useRef<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateCategoryIdx, setTemplateCategoryIdx] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery<any[]>({
    queryKey: ["/api/gallery"],
    enabled: isAuthenticated,
  });

  const { data: usage } = useQuery<any>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const isPro = usage?.tier === "pro";

  const layerItems = useMemo(() => {
    const items: Array<
      | { type: "char"; id: string; z: number; label: string; thumb?: string }
      | { type: "bubble"; id: string; z: number; label: string; thumb?: string }
    > = [
      ...characterOverlays.map((c) => ({
        type: "char" as const,
        id: c.id,
        z: c.zIndex ?? 0,
        label: c.label,
        thumb: c.imageUrl,
      })),
      ...bubbles.map((b, i) => ({
        type: "bubble" as const,
        id: b.id,
        z: b.zIndex ?? 10,
        label: b.text || STYLE_LABELS[b.style] || `말풍선 ${i + 1}`,
        thumb: b.style === "image" && b.templateSrc ? b.templateSrc : undefined,
      })),
    ];
    return items.sort((a, b) => a.z - b.z);
  }, [characterOverlays, bubbles]);

  const [dragLayerIdx, setDragLayerIdx] = useState<number | null>(null);
  const applyLayerOrder = useCallback((ordered: Array<{ type: "char" | "bubble"; id: string }>) => {
    setCharacterOverlays((prev) =>
      prev.map((c) => {
        const idx = ordered.findIndex((it) => it.type === "char" && it.id === c.id);
        return idx >= 0 ? { ...c, zIndex: idx } : c;
      }),
    );
    setBubbles((prev) =>
      prev.map((b) => {
        const idx = ordered.findIndex((it) => it.type === "bubble" && it.id === b.id);
        return idx >= 0 ? { ...b, zIndex: idx } : b;
      }),
    );
  }, []);

  const moveLayer = (index: number, direction: "up" | "down") => {
    const items = layerItems;
    if (direction === "up" && index <= 0) return;
    if (direction === "down" && index >= items.length - 1) return;
    const aIdx = index;
    const bIdx = direction === "up" ? index - 1 : index + 1;
    const a = items[aIdx];
    const b = items[bIdx];
    // swap z
    const newAz = b.z;
    const newBz = a.z;
    if (a.type === "char") {
      setCharacterOverlays((prev) =>
        prev.map((c) => (c.id === a.id ? { ...c, zIndex: newAz } : c)),
      );
    } else {
      setBubbles((prev) =>
        prev.map((bb) => (bb.id === a.id ? { ...bb, zIndex: newAz } : bb)),
      );
    }
    if (b.type === "char") {
      setCharacterOverlays((prev) =>
        prev.map((c) => (c.id === b.id ? { ...c, zIndex: newBz } : c)),
      );
    } else {
      setBubbles((prev) =>
        prev.map((bb) => (bb.id === b.id ? { ...bb, zIndex: newBz } : bb)),
      );
    }
  };

  const startBubbleTour = useCallback(() => {
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
            element: '[data-testid="bubble-toolbar"]',
            popover: { title: "툴바", description: "말풍선 추가, 이미지 업로드 등을 할 수 있어요." },
          },
          {
            element: '[data-testid="button-add-bubble"]',
            popover: { title: "말풍선 추가", description: "새 말풍선을 캔버스에 추가합니다." },
          },
          {
            element: '[data-testid="button-import-character"]',
            popover: { title: "캐릭터 불러오기", description: "갤러리에서 캐릭터를 캔버스로 가져옵니다." },
          },
          {
            element: '[data-testid="button-bubble-templates"]',
            popover: { title: "템플릿", description: "이미지 말풍선 템플릿을 선택할 수 있어요." },
          },
          {
            element: '[data-testid="canvas-editor"]',
            popover: { title: "캔버스", description: "요소를 드래그하여 위치와 크기를 조정하세요." },
          },
          {
            element: '[data-testid="bottom-toolbar"]',
            popover: { title: "줌/맞춤", description: "확대/축소하거나 화면에 맞출 수 있어요." },
          },
        ],
      });
      driverObj.drive();
    });
  }, []);
  const urlParams = new URLSearchParams(window.location.search);
  const loadProjectId = urlParams.get("projectId");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
        if (data.canvasSize) setCanvasSize(data.canvasSize);
        if (data.bubbles) {
          const restoredBubbles: SpeechBubble[] = data.bubbles.map((b: any) => {
            const restored = { ...b, templateImg: undefined };
            if (b.templateSrc) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                setBubbles(prev => prev.map(pb => pb.id === restored.id ? { ...pb, templateImg: img } : pb));
              };
              img.src = b.templateSrc;
            }
            return restored;
          });
          setBubbles(restoredBubbles);
        }
        if (data.characterOverlays) {
          const restoredOverlays: CharacterOverlay[] = data.characterOverlays.map((c: any) => {
            const restored: CharacterOverlay = { ...c, imgElement: null };
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              setCharacterOverlays(prev => prev.map(pc => pc.id === restored.id ? { ...pc, imgElement: img } : pc));
            };
            img.src = c.imageUrl;
            return restored;
          });
          setCharacterOverlays(restoredOverlays);
        }
        if (data.imageDataUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => setImage(img);
          img.src = data.imageDataUrl;
        }
      } catch (e) {
        console.error("Failed to load project data:", e);
        toast({ title: "프로젝트 로드 실패", variant: "destructive" });
      }
    }
  }, [loadedProject, toast]);

  const selectedBubble = bubbles.find((b) => b.id === selectedId) || null;
  const selectedCharOverlay = characterOverlays.find((c) => c.id === selectedCharId) || null;

  useEffect(() => {
    if (!fontsInjected) {
      const style = document.createElement("style");
      style.textContent = FONT_CSS;
      document.head.appendChild(style);
      setFontsInjected(true);
    }
  }, [fontsInjected]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    bubblesRef.current = bubbles;
  }, [bubbles]);

  useEffect(() => {
    characterOverlaysRef.current = characterOverlays;
  }, [characterOverlays]);

  useEffect(() => {
    selectedCharIdRef.current = selectedCharId;
  }, [selectedCharId]);

  const addCharacterFromGallery = useCallback((item: any) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = Math.min(canvasSize.width, canvasSize.height) * 0.4;
      const aspect = img.width / img.height;
      let w: number, h: number;
      if (aspect > 1) {
        w = maxDim;
        h = maxDim / aspect;
      } else {
        h = maxDim;
        w = maxDim * aspect;
      }
      const overlay: CharacterOverlay = {
        id: generateId(),
        imageUrl: item.resultImageUrl,
        imgElement: img,
        x: canvasSize.width / 2 - w / 2,
        y: canvasSize.height / 2 - h / 2,
        width: w,
        height: h,
        originalWidth: img.width,
        originalHeight: img.height,
        label: item.prompt?.slice(0, 20) || item.type || "캐릭터",
        zIndex: 0,
      };
      setCharacterOverlays((prev) => [...prev, overlay]);
      setSelectedCharId(overlay.id);
      setSelectedId(null);
      setShowGalleryPicker(false);
      toast({ title: "캐릭터 추가됨", description: "캔버스에서 드래그하여 위치와 크기를 조절하세요." });
    };
    img.onerror = () => {
      toast({ title: "이미지 로드 실패", description: "이미지를 불러올 수 없습니다.", variant: "destructive" });
    };
    img.src = item.resultImageUrl;
  }, [canvasSize, toast]);

  const addBubbleTemplate = useCallback((templatePath: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = Math.min(canvasSize.width, canvasSize.height) * 0.45;
      const aspect = img.width / img.height;
      let w: number, h: number;
      if (aspect > 1) {
        w = maxDim;
        h = maxDim / aspect;
      } else {
        h = maxDim;
        w = maxDim * aspect;
      }
      const newBubble: SpeechBubble = {
        id: generateId(),
        seed: Math.floor(Math.random() * 100000),
        x: canvasSize.width / 2 - w / 2,
        y: canvasSize.height / 2 - h / 2,
        width: w,
        height: h,
        text: "",
        style: "image",
        tailStyle: "none",
        tailDirection: "bottom",
        tailBaseSpread: 8,
        tailLength: undefined,
        tailCurve: 0.5,
        tailJitter: 1,
        dotsScale: 1,
        dotsSpacing: 1,
        strokeWidth: 2,
        wobble: 5,
        fontSize: 16,
        fontKey: "default",
        templateSrc: templatePath,
        templateImg: img,
        zIndex: 10,
      };
      setBubbles((prev) => [...prev, newBubble]);
      setSelectedId(newBubble.id);
      setSelectedCharId(null);
      setShowTemplatePicker(false);
      toast({ title: "말풍선 추가됨", description: "텍스트를 입력하고 크기를 조절하세요." });
    };
    img.onerror = () => {
      toast({ title: "템플릿 로드 실패", variant: "destructive" });
    };
    img.src = templatePath;
  }, [canvasSize, toast]);

  const updateCharOverlay = useCallback((id: string, updates: Partial<CharacterOverlay>) => {
    setCharacterOverlays((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCharOverlay = (id: string) => {
    setCharacterOverlays((prev) => prev.filter((c) => c.id !== id));
    if (selectedCharId === id) setSelectedCharId(null);
  };

  const moveCharOverlay = (index: number, direction: "up" | "down") => {
    setCharacterOverlays((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, zIndex: (c.zIndex ?? 0) + (direction === "up" ? 1 : -1) } : c,
      ),
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);

        const container = containerRef.current;
        const maxW = container ? container.clientWidth : 800;
        const maxH = 700;

        let w = img.width;
        let h = img.height;
        const s = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * s);
        h = Math.round(h * s);

        setCanvasSize({ width: w, height: h });
        setBubbles([]);
        setSelectedId(null);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const drawCharOverlaySelection = useCallback((ctx: CanvasRenderingContext2D, c: CharacterOverlay) => {
    ctx.save();
    ctx.strokeStyle = "hsl(262, 83%, 58%)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(c.x, c.y, c.width, c.height);
    ctx.setLineDash([]);

    const hs = 7;
    const corners = [
      { x: c.x, y: c.y },
      { x: c.x + c.width, y: c.y },
      { x: c.x, y: c.y + c.height },
      { x: c.x + c.width, y: c.y + c.height },
    ];
    corners.forEach((pt) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pt.x - hs / 2, pt.y - hs / 2, hs, hs);
      ctx.strokeStyle = "hsl(262, 83%, 58%)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pt.x - hs / 2, pt.y - hs / 2, hs, hs);
    });
    ctx.restore();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const drawables: Array<
      | { type: "char"; z: number; c: CharacterOverlay }
      | { type: "bubble"; z: number; b: SpeechBubble }
    > = [
      ...characterOverlays.map((c) => ({
        type: "char" as const,
        z: c.zIndex ?? 0,
        c,
      })),
      ...bubbles.map((b) => ({
        type: "bubble" as const,
        z: b.zIndex ?? 10,
        b,
      })),
    ];
    drawables.sort((a, b) => a.z - b.z);
    drawables.forEach((d) => {
      if (d.type === "char") {
        const c = d.c;
        if (c.imgElement) {
          ctx.drawImage(c.imgElement, c.x, c.y, c.width, c.height);
        }
        if (c.id === selectedCharId) {
          drawCharOverlaySelection(ctx, c);
        }
      } else {
        const b = d.b;
        drawBubble(ctx, b, b.id === selectedId);
      }
    });
  }, [image, bubbles, selectedId, characterOverlays, selectedCharId, drawCharOverlaySelection]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const addBubble = () => {
    const newBubble: SpeechBubble = {
      id: generateId(),
      seed: Math.floor(Math.random() * 1000000),
      x: canvasSize.width / 2 - 80,
      y: canvasSize.height / 2 - 40,
      width: 160,
      height: 80,
      text: "",
      style: "linedrawing",
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
      fontSize: 14,
      fontKey: "default",
      zIndex: 10,
    };
    setBubbles((prev) => [...prev, newBubble]);
    setSelectedId(newBubble.id);
  };

  const updateBubble = useCallback((id: string, updates: Partial<SpeechBubble>) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBubble = (id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const getHandleAtPos = useCallback((x: number, y: number, b: SpeechBubble): DragMode => {
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
      if (Math.abs(x - h.hx) < hs && Math.abs(y - h.hy) < hs) {
        return h.mode;
      }
    }
    return null;
  }, []);

  const getCharHandleAtPos = useCallback((x: number, y: number, c: CharacterOverlay): DragMode => {
    const hs = 12;
    const corners: { mode: DragMode; cx: number; cy: number }[] = [
      { mode: "char-resize-tl", cx: c.x, cy: c.y },
      { mode: "char-resize-tr", cx: c.x + c.width, cy: c.y },
      { mode: "char-resize-bl", cx: c.x, cy: c.y + c.height },
      { mode: "char-resize-br", cx: c.x + c.width, cy: c.y + c.height },
    ];
    for (const h of corners) {
      if (Math.abs(x - h.cx) < hs && Math.abs(y - h.cy) < hs) return h.mode;
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const pos = getCanvasPos(e.clientX, e.clientY);
    const currentBubbles = bubblesRef.current;
    const currentSelected = selectedIdRef.current;
    const currentChars = characterOverlaysRef.current;
    const currentCharSel = selectedCharIdRef.current;

    if (currentSelected) {
      const selBubble = currentBubbles.find((b) => b.id === currentSelected);
      if (selBubble) {
        const handle = getHandleAtPos(pos.x, pos.y, selBubble);
        if (handle) {
          dragModeRef.current = handle;
          dragStartRef.current = pos;
          dragBubbleStartRef.current = { x: selBubble.x, y: selBubble.y, w: selBubble.width, h: selBubble.height };
          return;
        }
      }
    }

    if (currentCharSel) {
      const selChar = currentChars.find((c) => c.id === currentCharSel);
      if (selChar) {
        const charHandle = getCharHandleAtPos(pos.x, pos.y, selChar);
        if (charHandle) {
          dragModeRef.current = charHandle;
          dragStartRef.current = pos;
          dragBubbleStartRef.current = { x: selChar.x, y: selChar.y, w: selChar.width, h: selChar.height };
          return;
        }
      }
    }

    {
      const drawables: Array<
        | { type: "char"; z: number; c: CharacterOverlay }
        | { type: "bubble"; z: number; b: SpeechBubble }
      > = [
        ...currentChars.map((c) => ({ type: "char" as const, z: c.zIndex ?? 0, c })),
        ...currentBubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
      ];
      drawables.sort((a, b) => a.z - b.z);
      for (let i = drawables.length - 1; i >= 0; i--) {
        const d = drawables[i];
        if (d.type === "bubble") {
          const b = d.b;
          if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
            setSelectedId(b.id);
            selectedIdRef.current = b.id;
            setSelectedCharId(null);
            selectedCharIdRef.current = null;
            dragModeRef.current = "move";
            dragStartRef.current = pos;
            dragBubbleStartRef.current = { x: b.x, y: b.y, w: b.width, h: b.height };
            return;
          }
        } else {
          const c = d.c;
          if (pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
            setSelectedCharId(c.id);
            selectedCharIdRef.current = c.id;
            setSelectedId(null);
            selectedIdRef.current = null;
            dragModeRef.current = "char-move";
            dragStartRef.current = pos;
            dragBubbleStartRef.current = { x: c.x, y: c.y, w: c.width, h: c.height };
            return;
          }
        }
      }
    }

    setSelectedId(null);
    selectedIdRef.current = null;
    setSelectedCharId(null);
    selectedCharIdRef.current = null;
  }, [getCanvasPos, getHandleAtPos, getCharHandleAtPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const mode = dragModeRef.current;
    const sid = selectedIdRef.current;
    const charSid = selectedCharIdRef.current;

    if (!mode || (!sid && !charSid)) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const currentBubbles = bubblesRef.current;
      const currentChars = characterOverlaysRef.current;

      if (sid) {
        const selBubble = currentBubbles.find((b) => b.id === sid);
        if (selBubble) {
          const handle = getHandleAtPos(pos.x, pos.y, selBubble);
          if (handle) {
            const cursorMap: Record<string, string> = {
              "resize-tl": "nw-resize", "resize-tr": "ne-resize",
              "resize-bl": "sw-resize", "resize-br": "se-resize",
              "resize-t": "n-resize", "resize-b": "s-resize",
              "resize-l": "w-resize", "resize-r": "e-resize",
              "move-tail": "crosshair",
            };
            canvas.style.cursor = cursorMap[handle] || "default";
            return;
          }
        }
      }

      if (charSid) {
        const selChar = currentChars.find((c) => c.id === charSid);
        if (selChar) {
          const charHandle = getCharHandleAtPos(pos.x, pos.y, selChar);
          if (charHandle) {
            const cursorMap: Record<string, string> = {
              "char-resize-tl": "nw-resize", "char-resize-tr": "ne-resize",
              "char-resize-bl": "sw-resize", "char-resize-br": "se-resize",
            };
            canvas.style.cursor = cursorMap[charHandle] || "default";
            return;
          }
        }
      }

      let overElement = false;
      {
        const drawables: Array<
          | { type: "char"; z: number; c: CharacterOverlay }
          | { type: "bubble"; z: number; b: SpeechBubble }
        > = [
          ...currentChars.map((c) => ({ type: "char" as const, z: c.zIndex ?? 0, c })),
          ...currentBubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
        ];
        drawables.sort((a, b) => a.z - b.z);
        for (let i = drawables.length - 1; i >= 0; i--) {
          const d = drawables[i];
          if (d.type === "bubble") {
            const b = d.b;
            if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
              canvas.style.cursor = "move";
              overElement = true;
              break;
            }
          } else {
            const c = d.c;
            if (pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
              canvas.style.cursor = "move";
              overElement = true;
              break;
            }
          }
        }
      }
      if (!overElement) canvas.style.cursor = "default";
      return;
    }

    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;
    const bs = dragBubbleStartRef.current;
    const minSize = 40;
    const charMinSize = 30;

    if (mode === "char-move" && charSid) {
      updateCharOverlay(charSid, { x: bs.x + dx, y: bs.y + dy });
      return;
    } else if (mode?.startsWith("char-resize") && charSid) {
      const aspect = bs.w / bs.h;
      if (mode === "char-resize-br") {
        const newW = Math.max(charMinSize, bs.w + dx);
        updateCharOverlay(charSid, { width: newW, height: newW / aspect });
      } else if (mode === "char-resize-bl") {
        const newW = Math.max(charMinSize, bs.w - dx);
        updateCharOverlay(charSid, { x: bs.x + bs.w - newW, width: newW, height: newW / aspect });
      } else if (mode === "char-resize-tr") {
        const newW = Math.max(charMinSize, bs.w + dx);
        updateCharOverlay(charSid, { y: bs.y + bs.h - newW / aspect, width: newW, height: newW / aspect });
      } else if (mode === "char-resize-tl") {
        const newW = Math.max(charMinSize, bs.w - dx);
        const newH = newW / aspect;
        updateCharOverlay(charSid, { x: bs.x + bs.w - newW, y: bs.y + bs.h - newH, width: newW, height: newH });
      }
      return;
    }

    if (mode === "move-tail" && sid) {
      updateBubble(sid, { tailTipX: pos.x, tailTipY: pos.y });
    } else if (mode === "move" && sid) {
      updateBubble(sid, { x: bs.x + dx, y: bs.y + dy });
    } else if (mode === "resize-br" && sid) {
      updateBubble(sid, { width: Math.max(minSize, bs.w + dx), height: Math.max(minSize, bs.h + dy) });
    } else if (mode === "resize-bl" && sid) {
      const newW = Math.max(minSize, bs.w - dx);
      updateBubble(sid, { x: bs.x + bs.w - newW, width: newW, height: Math.max(minSize, bs.h + dy) });
    } else if (mode === "resize-tr" && sid) {
      const newH = Math.max(minSize, bs.h - dy);
      updateBubble(sid, { y: bs.y + bs.h - newH, width: Math.max(minSize, bs.w + dx), height: newH });
    } else if (mode === "resize-tl" && sid) {
      const newW = Math.max(minSize, bs.w - dx);
      const newH = Math.max(minSize, bs.h - dy);
      updateBubble(sid, { x: bs.x + bs.w - newW, y: bs.y + bs.h - newH, width: newW, height: newH });
    } else if (mode === "resize-r" && sid) {
      updateBubble(sid, { width: Math.max(minSize, bs.w + dx) });
    } else if (mode === "resize-l" && sid) {
      const newW = Math.max(minSize, bs.w - dx);
      updateBubble(sid, { x: bs.x + bs.w - newW, width: newW });
    } else if (mode === "resize-b" && sid) {
      updateBubble(sid, { height: Math.max(minSize, bs.h + dy) });
    } else if (mode === "resize-t" && sid) {
      const newH = Math.max(minSize, bs.h - dy);
      updateBubble(sid, { y: bs.y + bs.h - newH, height: newH });
    }
  }, [getCanvasPos, getHandleAtPos, getCharHandleAtPos, updateBubble, updateCharOverlay]);

  const handlePointerUp = useCallback(() => {
    dragModeRef.current = null;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const currentBubbles = bubblesRef.current;
    for (let i = currentBubbles.length - 1; i >= 0; i--) {
      const b = currentBubbles[i];
      if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
        setSelectedId(b.id);
        selectedIdRef.current = b.id;
        setEditingBubbleId(b.id);
        return;
      }
    }
  }, [getCanvasPos]);

  const handleDownload = () => {
    const exportCanvas = document.createElement("canvas");
    if (image) {
      exportCanvas.width = image.width;
      exportCanvas.height = image.height;
    } else {
      exportCanvas.width = canvasSize.width * 2;
      exportCanvas.height = canvasSize.height * 2;
    }
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    if (image) {
      ctx.drawImage(image, 0, 0);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    const exportScale = (image ? image.width : exportCanvas.width) / canvasSize.width;

    characterOverlays.forEach((c) => {
      if (c.imgElement) {
        ctx.drawImage(c.imgElement, c.x * exportScale, c.y * exportScale, c.width * exportScale, c.height * exportScale);
      }
    });

    bubbles.forEach((b) => {
      const scaledBubble: SpeechBubble = {
        ...b,
        x: b.x * exportScale,
        y: b.y * exportScale,
        width: b.width * exportScale,
        height: b.height * exportScale,
        strokeWidth: b.strokeWidth * exportScale,
        wobble: b.wobble * exportScale,
        fontSize: b.fontSize * exportScale,
      };
      drawBubble(ctx, scaledBubble, false);
    });

    const link = document.createElement("a");
    link.download = `bubble-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    toast({ title: "다운로드 완료", description: "말풍선이 포함된 이미지가 저장되었습니다." });
  };

  const getCanvasDataUrl = useCallback(() => {
    const exportCanvas = document.createElement("canvas");
    const thumbW = 300;
    const thumbH = Math.round((canvasSize.height / canvasSize.width) * thumbW);
    exportCanvas.width = thumbW;
    exportCanvas.height = thumbH;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return "";
    const scale = thumbW / canvasSize.width;
    if (image) {
      ctx.drawImage(image, 0, 0, thumbW, thumbH);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, thumbW, thumbH);
    }
    characterOverlays.forEach((c) => {
      if (c.imgElement) {
        ctx.drawImage(c.imgElement, c.x * scale, c.y * scale, c.width * scale, c.height * scale);
      }
    });
    bubbles.forEach((b) => {
      const sb: SpeechBubble = {
        ...b,
        x: b.x * scale, y: b.y * scale,
        width: b.width * scale, height: b.height * scale,
        strokeWidth: b.strokeWidth * scale, wobble: b.wobble * scale,
        fontSize: b.fontSize * scale,
      };
      drawBubble(ctx, sb, false);
    });
    return exportCanvas.toDataURL("image/jpeg", 0.7);
  }, [image, bubbles, characterOverlays, canvasSize]);

  const serializeCanvasData = useCallback(() => {
    const serializedBubbles = bubbles.map(b => ({
      ...b,
      templateImg: undefined,
    }));
    const serializedOverlays = characterOverlays.map(c => ({
      ...c,
      imgElement: undefined,
    }));
    let imageDataUrl: string | undefined;
    if (image) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        imageDataUrl = tempCanvas.toDataURL("image/jpeg", 0.8);
      }
    }
    return JSON.stringify({
      canvasSize,
      bubbles: serializedBubbles,
      characterOverlays: serializedOverlays,
      imageDataUrl,
    });
  }, [bubbles, characterOverlays, canvasSize, image]);

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({ title: "프로젝트 이름을 입력하세요", variant: "destructive" });
      return;
    }
    setSavingProject(true);
    try {
      const canvasData = serializeCanvasData();
      const thumbnailUrl = getCanvasDataUrl();
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
          editorType: "bubble",
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

  const getExportBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const exportCanvas = document.createElement("canvas");
      if (image) {
        exportCanvas.width = image.width;
        exportCanvas.height = image.height;
      } else {
        exportCanvas.width = canvasSize.width * 2;
        exportCanvas.height = canvasSize.height * 2;
      }
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      if (image) {
        ctx.drawImage(image, 0, 0);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }
      const exportScale = (image ? image.width : exportCanvas.width) / canvasSize.width;
      const drawables: Array<
        | { type: "char"; z: number; c: CharacterOverlay }
        | { type: "bubble"; z: number; b: SpeechBubble }
      > = [
        ...characterOverlays.map((c) => ({ type: "char" as const, z: c.zIndex ?? 0, c })),
        ...bubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
      ];
      drawables.sort((a, b) => a.z - b.z);
      drawables.forEach((d) => {
        if (d.type === "char") {
          const c = d.c;
          if (c.imgElement) {
            ctx.drawImage(
              c.imgElement,
              c.x * exportScale,
              c.y * exportScale,
              c.width * exportScale,
              c.height * exportScale,
            );
          }
        } else {
          const b = d.b;
          const scaledBubble: SpeechBubble = {
            ...b,
            x: b.x * exportScale,
            y: b.y * exportScale,
            width: b.width * exportScale,
            height: b.height * exportScale,
            strokeWidth: b.strokeWidth * exportScale,
            wobble: b.wobble * exportScale,
            fontSize: b.fontSize * exportScale,
          };
          drawBubble(ctx, scaledBubble, false);
        }
      });
      exportCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [image, canvasSize, characterOverlays, bubbles]);

  const handleShareInstagram = async () => {
    try {
      const blob = await getExportBlob();
      if (!blob) {
        toast({ title: "공유 실패", description: "이미지를 생성할 수 없습니다.", variant: "destructive" });
        return;
      }
      const file = new File([blob], `charagen-${Date.now()}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "CharaGen 말풍선",
          text: "CharaGen으로 만든 말풍선 이미지",
          files: [file],
        });
        toast({ title: "공유 완료", description: "Instagram에 공유되었습니다." });
      } else {
        handleDownload();
        window.open("https://www.instagram.com/", "_blank");
        toast({ title: "Instagram 열기", description: "이미지가 다운로드되었습니다. Instagram에서 새 게시물로 업로드하세요." });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        handleDownload();
        toast({ title: "다운로드 완료", description: "이미지가 저장되었습니다. Instagram에서 업로드하세요." });
      }
    }
  };

  const fitToView = useCallback(() => {
    setZoom(100);
  }, []);

  /* 최초 진입 시 기본 100% 유지 */
  useEffect(() => {
    const mz = getMaxZoom();
    setZoom((z) => Math.min(z, mz));
  }, [getMaxZoom]);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((z) => {
          const dir = e.deltaY < 0 ? 1.1 : 0.9;
          const nz = Math.round(Math.max(20, Math.min(getMaxZoom(), z * dir)));
          return nz;
        });
      }
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel as any);
  }, [getMaxZoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoom((z) => Math.min(getMaxZoom(), z + 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(20, z - 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoom(100);
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
  }, [fitToView, getMaxZoom]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2" data-testid="text-login-required-bubble">로그인이 필요합니다</h2>
        <p className="text-sm text-muted-foreground mb-5">말풍선 에디터를 사용하려면 로그인해주세요.</p>
        <Button size="sm" asChild data-testid="button-login-bubble">
          <a href="/login" className="gap-2">로그인 <ArrowRight className="h-3.5 w-3.5" /></a>
        </Button>
      </div>
    );
  }

  return (
    <div className="editor-page h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <EditorOnboarding editor="bubble" />
      <div className="w-full relative" data-testid="bubble-toolbar">
        <div
          className="flex items-center justify-between gap-3 px-5 py-2 w-full flex-wrap bg-background/60 dark:bg-background/40"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-6 h-6 rounded-md bg-[hsl(173_100%_35%)] flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-white" />
              </div>
              <h1 className="text-sm font-bold tracking-tight" data-testid="text-bubble-title">말풍선</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={addBubble} className="gap-1 h-7 text-xs px-2.5" data-testid="button-add-bubble">
                <Plus className="h-3 w-3" />
                추가
              </Button>
              <label>
                <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs px-2" asChild>
                  <span>
                    <Upload className="h-3 w-3" />
                    {image ? "교체" : "업로드"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="input-image-upload" />
                  </span>
                </Button>
              </label>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowGalleryPicker(true)} title="캐릭터 불러오기" data-testid="button-import-character">
                <ImagePlus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowTemplatePicker(true)} title="템플릿" data-testid="button-bubble-templates">
                <Layers className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startBubbleTour} title="도움말" data-testid="button-bubble-help">
              <Lightbulb className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDownload} title="다운로드" data-testid="button-download-bubble">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => setShowSaveModal(true)} className="gap-1 h-7 text-xs px-2.5 bg-[hsl(173_100%_35%)] text-white border-[hsl(173_100%_35%)]" data-testid="button-save-project">
              <Save className="h-3 w-3" />
              저장
              {isPro && <Crown className="h-2.5 w-2.5 ml-0.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLocation("/edits")} title="내 편집" data-testid="button-my-edits">
              <FolderOpen className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[hsl(173_100%_35%)] to-transparent opacity-60" />
      </div>

      <div className="flex flex-1 min-h-0">
        <div ref={containerRef} className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div
            ref={canvasAreaRef}
            className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-muted/30 p-4"
            data-testid="canvas-area"
          >
            <div
              ref={canvasWrapperRef}
              className="border border-border rounded-md overflow-hidden relative shrink-0 shadow-sm"
              style={{ width: canvasSize.width * (zoom / 100), height: canvasSize.height * (zoom / 100) }}
              data-testid="canvas-container"
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onDoubleClick={handleDoubleClick}
                data-testid="canvas-editor"
              />
              {editingBubbleId && (() => {
                const eb = bubbles.find((b) => b.id === editingBubbleId);
                if (!eb || !canvasRef.current || !canvasWrapperRef.current) return null;
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                const font = KOREAN_FONTS.find((f) => f.value === eb.fontKey);
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
                      fontFamily: font?.family || "sans-serif",
                      textAlign: "center",
                      lineHeight: 1.3,
                      color: "black",
                    }}
                    value={eb.text}
                    onChange={(e) => updateBubble(eb.id, { text: e.target.value })}
                    onBlur={() => setEditingBubbleId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingBubbleId(null);
                    }}
                    data-testid="input-inline-bubble-text"
                  />
                );
              })()}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-border bg-background shrink-0" data-testid="bottom-toolbar">
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.max(20, Math.min(getMaxZoom(), z - 10)))}
                disabled={zoom <= 20}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Slider
                min={20}
                max={getMaxZoom()}
                step={5}
                value={[zoom]}
                onValueChange={([v]) => setZoom(Math.min(getMaxZoom(), v))}
                className="w-28"
                data-testid="slider-zoom"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.min(getMaxZoom(), z + 10))}
                disabled={zoom >= getMaxZoom()}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums w-9 text-right" data-testid="text-zoom-value">{zoom}%</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <Button
              size="icon"
              variant="ghost"
              onClick={fitToView}
              title="화면에 맞추기"
              data-testid="button-fit-to-view"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="w-[300px] shrink-0 border-l border-border overflow-y-auto p-4 space-y-4 hidden lg:block">
          {selectedCharOverlay ? (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <h3 className="text-xs font-semibold" data-testid="label-char-overlay-settings">캐릭터 설정</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCharOverlay(selectedCharOverlay.id)}
                  className="gap-1 text-destructive"
                  data-testid="button-delete-char-overlay"
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </Button>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateCharOverlay(selectedCharOverlay.id, {
                      zIndex: (selectedCharOverlay.zIndex ?? 0) + 1,
                    })
                  }
                >
                  앞으로
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateCharOverlay(selectedCharOverlay.id, {
                      zIndex: (selectedCharOverlay.zIndex ?? 0) - 1,
                    })
                  }
                >
                  뒤로
                </Button>
              </div>
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden border border-border/40">
                  {selectedCharOverlay.imgElement && (
                    <img
                      src={selectedCharOverlay.imageUrl}
                      alt={selectedCharOverlay.label}
                      className="w-full h-auto max-h-28 object-contain bg-muted/30"
                      data-testid="img-char-overlay-preview"
                    />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate" data-testid="text-char-overlay-label">{selectedCharOverlay.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">너비</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedCharOverlay.width)}
                      onChange={(e) => {
                        const w = Math.max(20, parseInt(e.target.value) || 20);
                        const aspect = selectedCharOverlay.originalWidth / selectedCharOverlay.originalHeight;
                        updateCharOverlay(selectedCharOverlay.id, { width: w, height: w / aspect });
                      }}
                      data-testid="input-char-width"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">높이</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedCharOverlay.height)}
                      onChange={(e) => {
                        const h = Math.max(20, parseInt(e.target.value) || 20);
                        const aspect = selectedCharOverlay.originalWidth / selectedCharOverlay.originalHeight;
                        updateCharOverlay(selectedCharOverlay.id, { height: h, width: h * aspect });
                      }}
                      data-testid="input-char-height"
                    />
                  </div>
                </div>
                <div className="p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Move className="h-3 w-3" />
                    <span>드래그로 캐릭터 이동</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="h-3 w-3" />
                    <span>모서리 드래그로 비율 유지 크기 조절</span>
                  </div>
                </div>
              </div>
            </Card>
          ) : selectedBubble ? (
              <>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <h3 className="text-xs font-semibold" data-testid="label-bubble-settings">말풍선 설정</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBubble(selectedBubble.id)}
                      className="gap-1 text-destructive"
                      data-testid="button-delete-bubble"
                    >
                      <Trash2 className="h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
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

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs mb-1.5 block">텍스트</Label>
                      <Textarea
                        value={selectedBubble.text}
                        onChange={(e) => updateBubble(selectedBubble.id, { text: e.target.value })}
                        placeholder="말풍선 내용을 입력하세요..."
                        rows={3}
                        data-testid="input-bubble-text"
                      />
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">글씨체</Label>
                      <Select
                        value={selectedBubble.fontKey}
                        onValueChange={(v) => updateBubble(selectedBubble.id, { fontKey: v })}
                      >
                        <SelectTrigger data-testid="select-font">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[280px]">
                          {KOREAN_FONTS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              <span style={{ fontFamily: f.family }}>{f.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">말풍선 스타일</Label>
                      <Select
                        value={selectedBubble.style}
                        onValueChange={(v) => updateBubble(selectedBubble.id, { style: v as BubbleStyle, seed: Math.floor(Math.random() * 1000000) })}
                      >
                        <SelectTrigger data-testid="select-bubble-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STYLE_LABELS).filter(([key]) => key !== "image").map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">말꼬리 스타일</Label>
                      <Select
                        value={selectedBubble.tailStyle}
                        onValueChange={(v) => updateBubble(selectedBubble.id, { tailStyle: v as TailStyle })}
                      >
                        <SelectTrigger data-testid="select-tail-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TAIL_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedBubble.tailStyle !== "none" && (
                      <div>
                        <Label className="text-xs mb-1.5 block">말꼬리 방향</Label>
                        <Select
                          value={selectedBubble.tailDirection}
                          onValueChange={(v) => updateBubble(selectedBubble.id, { tailDirection: v as SpeechBubble["tailDirection"] })}
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
                          <Label className="text-xs mb-1.5 block">말꼬리 길이</Label>
                          <Slider
                            value={[selectedBubble.tailLength ?? (selectedBubble.tailStyle === "long" ? 50 : 25)]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { tailLength: v })}
                            min={10}
                            max={120}
                            step={2}
                            data-testid="slider-tail-length"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">말꼬리 폭</Label>
                          <Slider
                            value={[selectedBubble.tailBaseSpread ?? 8]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { tailBaseSpread: v })}
                            min={4}
                            max={20}
                            step={1}
                            data-testid="slider-tail-spread"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">곡률</Label>
                          <Slider
                            value={[selectedBubble.tailCurve ?? 0.5]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { tailCurve: v })}
                            min={0.2}
                            max={0.8}
                            step={0.02}
                            data-testid="slider-tail-curve"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">랜덤 흔들림</Label>
                          <Slider
                            value={[selectedBubble.tailJitter ?? 1]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { tailJitter: v })}
                            min={0}
                            max={2}
                            step={0.1}
                            data-testid="slider-tail-jitter"
                          />
                        </div>
                        {selectedBubble.tailStyle.startsWith("dots_") && (
                          <>
                            <div>
                              <Label className="text-xs mb-1.5 block">점 크기 배율</Label>
                              <Slider
                                value={[selectedBubble.dotsScale ?? 1]}
                                onValueChange={([v]) => updateBubble(selectedBubble.id, { dotsScale: v })}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                data-testid="slider-dots-scale"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1.5 block">점 간격 배율</Label>
                              <Slider
                                value={[selectedBubble.dotsSpacing ?? 1]}
                                onValueChange={([v]) => updateBubble(selectedBubble.id, { dotsSpacing: v })}
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
                </Card>

                <Card className="p-4">
                  <h3 className="text-xs font-semibold mb-3" data-testid="label-style-adjustments">세부 조정</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <Label className="text-xs">테두리 두께</Label>
                        <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-stroke-value">{selectedBubble.strokeWidth}px</span>
                      </div>
                      <Slider
                        value={[selectedBubble.strokeWidth]}
                        onValueChange={([v]) => updateBubble(selectedBubble.id, { strokeWidth: v })}
                        min={1}
                        max={6}
                        step={0.5}
                        data-testid="slider-stroke-width"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <Label className="text-xs">글자 크기</Label>
                        <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-fontsize-value">{selectedBubble.fontSize}px</span>
                      </div>
                      <Slider
                        value={[selectedBubble.fontSize]}
                        onValueChange={([v]) => updateBubble(selectedBubble.id, { fontSize: v })}
                        min={8}
                        max={40}
                        step={1}
                        data-testid="slider-font-size"
                      />
                    </div>

                    {selectedBubble.style === "wobbly" && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <Label className="text-xs">불안 강도</Label>
                          <Input
                            type="number"
                            value={selectedBubble.wobble}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v >= 0 && v <= 20) {
                                updateBubble(selectedBubble.id, { wobble: v });
                              }
                            }}
                            step={1}
                            min={0}
                            max={20}
                            className="w-20 h-7 text-xs tabular-nums text-right"
                            data-testid="input-wobble-value"
                          />
                        </div>
                        <Slider
                          value={[selectedBubble.wobble]}
                          onValueChange={([v]) => updateBubble(selectedBubble.id, { wobble: v })}
                          min={0}
                          max={20}
                          step={1}
                          data-testid="slider-wobble"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
                          <span>0px</span>
                          <span>{selectedBubble.wobble}px</span>
                          <span>20px</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mb-1.5 block">너비</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedBubble.width)}
                          onChange={(e) => updateBubble(selectedBubble.id, { width: Math.max(40, parseInt(e.target.value) || 40) })}
                          data-testid="input-bubble-width"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">높이</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedBubble.height)}
                          onChange={(e) => updateBubble(selectedBubble.id, { height: Math.max(40, parseInt(e.target.value) || 40) })}
                          data-testid="input-bubble-height"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Move className="h-3 w-3" />
                    <span>드래그로 말풍선 이동</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="h-3 w-3" />
                    <span>모서리/변 드래그로 크기 조절</span>
                  </div>
                </div>
              </>
            ) : (
              <Card className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                  <Type className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-no-selection">
                  말풍선을 클릭하여 선택하거나<br />새 말풍선을 추가하세요
                </p>
                <Button size="sm" onClick={addBubble} className="mt-3 gap-1.5" data-testid="button-add-bubble-empty">
                  <Plus className="h-3.5 w-3.5" />
                  말풍선 추가
                </Button>
              </Card>
            )}

            {(characterOverlays.length > 0 || bubbles.length > 0) && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold mb-2" data-testid="label-layer-list">
                  레이어 목록 ({layerItems.length})
                </h3>
                <div className="space-y-1">
                  {layerItems.map((item, i) => (
                    <div
                      key={`${item.type}:${item.id}`}
                      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        item.type === "char"
                          ? selectedCharId === item.id
                            ? "bg-primary/10"
                            : "hover-elevate"
                          : selectedId === item.id
                          ? "bg-primary/10"
                          : "hover-elevate"
                      }`}
                      onClick={() => {
                        if (item.type === "char") {
                          setSelectedCharId(item.id);
                          setSelectedId(null);
                        } else {
                          setSelectedId(item.id);
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
                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-muted">
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
                              deleteCharOverlay(item.id);
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
              </Card>
            )}
          </div>
      </div>

      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTemplatePicker(false)} data-testid="modal-template-picker">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-wrap">
              <h3 className="text-sm font-semibold" data-testid="text-template-picker-title">말풍선 템플릿</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowTemplatePicker(false)} data-testid="button-close-templates">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto flex-wrap">
              {BUBBLE_TEMPLATE_CATEGORIES.map((cat, ci) => (
                <Badge
                  key={ci}
                  className={`cursor-pointer shrink-0 toggle-elevate ${ci === templateCategoryIdx ? "toggle-elevated" : ""}`}
                  variant={ci === templateCategoryIdx ? "default" : "outline"}
                  onClick={() => setTemplateCategoryIdx(ci)}
                  data-testid={`badge-template-category-${ci}`}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {BUBBLE_TEMPLATE_CATEGORIES[templateCategoryIdx]?.ids.map((id) => {
                  const path = bubblePath(id);
                  return (
                    <div
                      key={id}
                      className="aspect-square rounded-md border border-border overflow-hidden cursor-pointer hover-elevate bg-muted/30 p-1.5"
                      onClick={() => addBubbleTemplate(path)}
                      data-testid={`template-item-${id}`}
                    >
                      <img
                        src={path}
                        alt={`말풍선 템플릿 ${id}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">프로젝트 저장</DialogTitle>
          </DialogHeader>
          {isPro ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">프로젝트 이름</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름 입력..."
                  data-testid="input-project-name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSaveProject}
                  disabled={savingProject || !projectName.trim()}
                  className="gap-1.5 w-full"
                  data-testid="button-confirm-save"
                >
                  {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {currentProjectId ? "업데이트" : "저장하기"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareInstagram}
                  className="gap-1.5 w-full"
                  data-testid="button-share-instagram"
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
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Pro 전용 기능</p>
                <p className="text-xs text-muted-foreground">프로젝트 저장/관리는 Pro 멤버십 전용 기능입니다.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full gap-1.5" data-testid="button-upgrade-pro">
                  <a href="/pricing">
                    <Crown className="h-3.5 w-3.5" />
                    Pro 업그레이드
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareInstagram}
                  className="gap-1.5 w-full"
                  data-testid="button-share-instagram-free"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Instagram
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showGalleryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGalleryPicker(false)} data-testid="modal-gallery-picker">
          <Card className="w-full max-w-lg max-h-[75vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-wrap">
              <h3 className="text-sm font-semibold" data-testid="text-gallery-picker-title">캐릭터 가져오기</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowGalleryPicker(false)} data-testid="button-close-gallery">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {galleryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : galleryItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm" data-testid="text-gallery-empty">
                  생성된 캐릭터가 없습니다. 먼저 캐릭터를 생성해주세요.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {galleryItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="group rounded-md overflow-hidden border border-border cursor-pointer hover-elevate"
                      onClick={() => addCharacterFromGallery(item)}
                      data-testid={`gallery-item-${item.id}`}
                    >
                      <div className="aspect-[3/4] bg-muted relative">
                        <img
                          src={item.resultImageUrl}
                          alt={item.prompt || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Plus className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {item.type === "character" ? "캐릭터" : item.type === "pose" ? "포즈" : item.type === "background" ? "배경" : item.type}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.prompt?.slice(0, 25)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
