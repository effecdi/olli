import type { Canvas, FabricObject } from "fabric";

// ─── Tool modes ─────────────────────────────────────────────────────────────

export type ToolMode =
  | "select"
  | "draw"
  | "line"
  | "text"
  | "eraser";

export type DrawSubTool = "pencil" | "marker" | "highlighter";
export type LineSubTool = "straight" | "curve" | "polyline";

// ─── Drawing state ──────────────────────────────────────────────────────────

export interface DrawingConfig {
  subTool: DrawSubTool;
  color: string;
  size: number;      // 1–100
  opacity: number;   // 0–1
}

export interface LineConfig {
  subTool: LineSubTool;
  color: string;
  size: number;
  opacity: number;
}

export interface TextConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

// ─── Floating toolbar ───────────────────────────────────────────────────────

export interface FloatingToolbarPos {
  x: number;
  y: number;
  visible: boolean;
}

// ─── Editor handle (imperative) ─────────────────────────────────────────────

export interface CanvaEditorHandle {
  getCanvas: () => Canvas | null;
  exportImage: (format?: "png" | "jpeg") => string | null;
  toJSON: () => any;
  loadJSON: (json: any) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

// ─── Editor props ───────────────────────────────────────────────────────────

export interface CanvaEditorProps {
  width: number;
  height: number;
  className?: string;
  backgroundImage?: string | null;
  onObjectSelected?: (obj: FabricObject | null) => void;
}

// ─── Korean fonts ───────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  { label: "기본 고딕", family: "Apple SD Gothic Neo, Malgun Gothic, sans-serif" },
  { label: "프리텐다드", family: "Pretendard, Apple SD Gothic Neo, sans-serif" },
  { label: "지마켓 산스", family: "GMarketSans, Apple SD Gothic Neo, sans-serif" },
  { label: "카페24 서라운드", family: "Cafe24Surround, Apple SD Gothic Neo, sans-serif" },
  { label: "미모먼트 꾸꾸꾸", family: "MemomentKkukkukk, sans-serif" },
];

// ─── Color presets ──────────────────────────────────────────────────────────

export const COLOR_PRESETS = [
  "#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#5856d6",
  "#ff2d55", "#af52de", "#5ac8fa", "#ffd60a", "#30d158", "#64d2ff",
];
