import { useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseSensitive,
  List,
  Pilcrow,
  Sparkles,
  Play,
  Move,
  Paintbrush,
  Menu,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Spline,
  Minus,
  MoreHorizontal,
  Circle,
  Palette,
  X,
  ChevronDown,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type TextAlign = "left" | "center" | "right";
export type TextTransform = "none" | "uppercase" | "lowercase";
export type LineType = "straight" | "curved" | "polyline";
export type DashPattern = "solid" | "dashed" | "dotted";

export interface CanvasTextElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textAlign: TextAlign;
  textTransform: TextTransform;
  opacity: number;
  zIndex: number;
}

export interface CanvasLineElement {
  id: string;
  lineType: LineType;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
  startArrow: boolean;
  endArrow: boolean;
  dashPattern: DashPattern;
  zIndex: number;
}

export function createTextElement(canvasW: number, canvasH: number): CanvasTextElement {
  return {
    id: Math.random().toString(36).slice(2, 10),
    x: canvasW / 2 - 80,
    y: canvasH / 2 - 20,
    width: 160,
    height: 40,
    text: "텍스트 입력",
    fontFamily: "default",
    fontSize: 18,
    color: "#000000",
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    textAlign: "center",
    textTransform: "none",
    opacity: 1,
    zIndex: 20,
  };
}

export function createLineElement(
  canvasW: number,
  canvasH: number,
  lineType: LineType = "straight",
): CanvasLineElement {
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  let points: { x: number; y: number }[];

  switch (lineType) {
    case "curved":
      points = [
        { x: cx - 80, y: cy },
        { x: cx, y: cy - 50 },
        { x: cx + 80, y: cy },
      ];
      break;
    case "polyline":
      points = [
        { x: cx - 80, y: cy + 30 },
        { x: cx - 20, y: cy - 30 },
        { x: cx + 20, y: cy + 30 },
        { x: cx + 80, y: cy - 30 },
      ];
      break;
    default:
      points = [
        { x: cx - 80, y: cy },
        { x: cx + 80, y: cy },
      ];
  }

  return {
    id: Math.random().toString(36).slice(2, 10),
    lineType,
    points,
    color: "#000000",
    strokeWidth: 2,
    opacity: 1,
    startArrow: false,
    endArrow: false,
    dashPattern: "solid",
    zIndex: 20,
  };
}

// ─── Font options ──────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { value: "default", label: "기본" },
  { value: "noto-sans", label: "Noto Sans" },
  { value: "noto-serif", label: "Noto Serif" },
  { value: "poor-story", label: "푸어스토리" },
  { value: "gaegu", label: "개구" },
  { value: "jua", label: "주아" },
  { value: "single-day", label: "싱글데이" },
  { value: "hi-melody", label: "하이멜로디" },
];

const FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

const COLOR_PRESETS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

// ─── Text Context Toolbar ──────────────────────────────────────────────────

interface TextToolbarProps {
  element: CanvasTextElement;
  onChange: (updated: CanvasTextElement) => void;
}

export function TextContextToolbar({ element, onChange }: TextToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (partial: Partial<CanvasTextElement>) => {
      onChange({ ...element, ...partial });
    },
    [element, onChange],
  );

  return (
    <div className="context-toolbar context-toolbar--text">
      {/* Font family */}
      <div className="context-toolbar__dropdown-wrapper">
        <button
          className="context-toolbar__btn context-toolbar__btn--wide"
          onClick={() => setShowFontDropdown((v) => !v)}
        >
          <span className="context-toolbar__btn-label">
            {FONT_OPTIONS.find((f) => f.value === element.fontFamily)?.label || "기본"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showFontDropdown && (
          <div className="context-toolbar__dropdown">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                className={`context-toolbar__dropdown-item ${element.fontFamily === f.value ? "context-toolbar__dropdown-item--active" : ""}`}
                onClick={() => {
                  update({ fontFamily: f.value });
                  setShowFontDropdown(false);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="context-toolbar__divider" />

      {/* Font size */}
      <div className="context-toolbar__dropdown-wrapper">
        <button
          className="context-toolbar__btn context-toolbar__btn--narrow"
          onClick={() => setShowSizeDropdown((v) => !v)}
        >
          <span className="context-toolbar__btn-label">{element.fontSize}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showSizeDropdown && (
          <div className="context-toolbar__dropdown">
            {FONT_SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                className={`context-toolbar__dropdown-item ${element.fontSize === s ? "context-toolbar__dropdown-item--active" : ""}`}
                onClick={() => {
                  update({ fontSize: s });
                  setShowSizeDropdown(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="context-toolbar__divider" />

      {/* Color */}
      <div className="context-toolbar__dropdown-wrapper">
        <button
          className="context-toolbar__btn"
          onClick={() => setShowColorPicker((v) => !v)}
        >
          <span
            className="context-toolbar__color-dot"
            style={{ backgroundColor: element.color }}
          />
        </button>
        {showColorPicker && (
          <div className="context-toolbar__dropdown context-toolbar__dropdown--colors">
            <div className="context-toolbar__color-grid">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`context-toolbar__color-swatch ${element.color === c ? "context-toolbar__color-swatch--active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    update({ color: c });
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <div className="context-toolbar__custom-color-row">
              <input
                ref={colorInputRef}
                type="color"
                value={element.color}
                onChange={(e) => update({ color: e.target.value })}
                className="context-toolbar__color-input"
              />
              <span className="context-toolbar__color-hex">{element.color}</span>
            </div>
          </div>
        )}
      </div>

      <div className="context-toolbar__divider" />

      {/* Bold */}
      <button
        className={`context-toolbar__btn ${element.bold ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ bold: !element.bold })}
        title="굵게"
      >
        <Bold className="h-4 w-4" />
      </button>

      {/* Italic */}
      <button
        className={`context-toolbar__btn ${element.italic ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ italic: !element.italic })}
        title="기울임"
      >
        <Italic className="h-4 w-4" />
      </button>

      {/* Underline */}
      <button
        className={`context-toolbar__btn ${element.underline ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ underline: !element.underline })}
        title="밑줄"
      >
        <Underline className="h-4 w-4" />
      </button>

      {/* Strikethrough */}
      <button
        className={`context-toolbar__btn ${element.strikethrough ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ strikethrough: !element.strikethrough })}
        title="취소선"
      >
        <Strikethrough className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Text transform */}
      <button
        className={`context-toolbar__btn ${element.textTransform !== "none" ? "context-toolbar__btn--active" : ""}`}
        onClick={() => {
          const next: TextTransform =
            element.textTransform === "none"
              ? "uppercase"
              : element.textTransform === "uppercase"
                ? "lowercase"
                : "none";
          update({ textTransform: next });
        }}
        title="대소문자"
      >
        <CaseSensitive className="h-4 w-4" />
      </button>

      {/* Alignment */}
      <button
        className={`context-toolbar__btn`}
        onClick={() => {
          const next: TextAlign =
            element.textAlign === "left"
              ? "center"
              : element.textAlign === "center"
                ? "right"
                : "left";
          update({ textAlign: next });
        }}
        title="정렬"
      >
        {element.textAlign === "left" && <AlignLeft className="h-4 w-4" />}
        {element.textAlign === "center" && <AlignCenter className="h-4 w-4" />}
        {element.textAlign === "right" && <AlignRight className="h-4 w-4" />}
      </button>

      {/* List */}
      <button className="context-toolbar__btn" title="목록">
        <List className="h-4 w-4" />
      </button>

      {/* Text direction */}
      <button className="context-toolbar__btn" title="텍스트 방향">
        <Pilcrow className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Effects */}
      <button className="context-toolbar__btn" title="효과">
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Animation */}
      <button className="context-toolbar__btn" title="애니메이션">
        <Play className="h-4 w-4" />
      </button>

      {/* Position */}
      <button className="context-toolbar__btn" title="위치">
        <Move className="h-4 w-4" />
      </button>

      {/* Paint */}
      <button className="context-toolbar__btn" title="채우기">
        <Paintbrush className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Line Context Toolbar ──────────────────────────────────────────────────

interface LineToolbarProps {
  element: CanvasLineElement;
  onChange: (updated: CanvasLineElement) => void;
  onShowSettings: () => void;
  showSettings: boolean;
}

export function LineContextToolbar({ element, onChange, onShowSettings, showSettings }: LineToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (partial: Partial<CanvasLineElement>) => {
      onChange({ ...element, ...partial });
    },
    [element, onChange],
  );

  return (
    <div className="context-toolbar context-toolbar--line">
      {/* Color */}
      <div className="context-toolbar__dropdown-wrapper">
        <button
          className="context-toolbar__btn"
          onClick={() => setShowColorPicker((v) => !v)}
          title="색상"
        >
          <span
            className="context-toolbar__color-dot"
            style={{ backgroundColor: element.color }}
          />
        </button>
        {showColorPicker && (
          <div className="context-toolbar__dropdown context-toolbar__dropdown--colors">
            <div className="context-toolbar__color-grid">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`context-toolbar__color-swatch ${element.color === c ? "context-toolbar__color-swatch--active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    update({ color: c });
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <div className="context-toolbar__custom-color-row">
              <input
                ref={colorInputRef}
                type="color"
                value={element.color}
                onChange={(e) => update({ color: e.target.value })}
                className="context-toolbar__color-input"
              />
              <span className="context-toolbar__color-hex">{element.color}</span>
            </div>
          </div>
        )}
      </div>

      <div className="context-toolbar__divider" />

      {/* Settings menu (hamburger) */}
      <button
        className={`context-toolbar__btn ${showSettings ? "context-toolbar__btn--active" : ""}`}
        onClick={onShowSettings}
        title="설정"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Start arrow */}
      <button
        className={`context-toolbar__btn ${element.startArrow ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ startArrow: !element.startArrow })}
        title="시작 화살표"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {/* End arrow */}
      <button
        className={`context-toolbar__btn ${element.endArrow ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ endArrow: !element.endArrow })}
        title="끝 화살표"
      >
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Line type: straight */}
      <button
        className={`context-toolbar__btn ${element.lineType === "straight" ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ lineType: "straight" })}
        title="직선"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Line type: curved */}
      <button
        className={`context-toolbar__btn ${element.lineType === "curved" ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ lineType: "curved" })}
        title="곡선"
      >
        <Spline className="h-4 w-4" />
      </button>

      {/* Line type: polyline */}
      <button
        className={`context-toolbar__btn ${element.lineType === "polyline" ? "context-toolbar__btn--active" : ""}`}
        onClick={() => update({ lineType: "polyline" })}
        title="꺾인선"
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Dash pattern */}
      <button
        className={`context-toolbar__btn ${element.dashPattern !== "solid" ? "context-toolbar__btn--active" : ""}`}
        onClick={() => {
          const next: DashPattern =
            element.dashPattern === "solid"
              ? "dashed"
              : element.dashPattern === "dashed"
                ? "dotted"
                : "solid";
          update({ dashPattern: next });
        }}
        title="선 패턴"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Animation */}
      <button className="context-toolbar__btn" title="애니메이션">
        <Play className="h-4 w-4" />
      </button>

      {/* Position */}
      <button className="context-toolbar__btn" title="위치">
        <Move className="h-4 w-4" />
      </button>

      {/* Paint */}
      <button className="context-toolbar__btn" title="채우기">
        <Paintbrush className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Drawing Context Toolbar (when selecting a drawn stroke) ───────────────

interface DrawingToolbarProps {
  color: string;
  onColorChange: (color: string) => void;
  onShowSettings: () => void;
  showSettings: boolean;
}

export function DrawingContextToolbar({
  color,
  onColorChange,
  onShowSettings,
  showSettings,
}: DrawingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="context-toolbar context-toolbar--drawing">
      {/* Color */}
      <div className="context-toolbar__dropdown-wrapper">
        <button
          className="context-toolbar__btn"
          onClick={() => setShowColorPicker((v) => !v)}
          title="색상"
        >
          <span
            className="context-toolbar__color-dot"
            style={{ backgroundColor: color }}
          />
        </button>
        {showColorPicker && (
          <div className="context-toolbar__dropdown context-toolbar__dropdown--colors">
            <div className="context-toolbar__color-grid">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`context-toolbar__color-swatch ${color === c ? "context-toolbar__color-swatch--active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    onColorChange(c);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <div className="context-toolbar__custom-color-row">
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="context-toolbar__color-input"
              />
              <span className="context-toolbar__color-hex">{color}</span>
            </div>
          </div>
        )}
      </div>

      <div className="context-toolbar__divider" />

      {/* Settings menu (hamburger) */}
      <button
        className={`context-toolbar__btn ${showSettings ? "context-toolbar__btn--active" : ""}`}
        onClick={onShowSettings}
        title="설정"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="context-toolbar__divider" />

      {/* Pattern */}
      <button className="context-toolbar__btn" title="패턴">
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Animation */}
      <button className="context-toolbar__btn" title="애니메이션">
        <Play className="h-4 w-4" />
      </button>

      {/* Position */}
      <button className="context-toolbar__btn" title="위치">
        <Move className="h-4 w-4" />
      </button>

      {/* Paint */}
      <button className="context-toolbar__btn" title="채우기">
        <Paintbrush className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Line/Drawing Settings Floating Modal ──────────────────────────────────

interface SettingsModalProps {
  strokeWidth: number;
  opacity: number;
  onStrokeWidthChange: (v: number) => void;
  onOpacityChange: (v: number) => void;
  onClose: () => void;
}

export function FloatingSettingsModal({
  strokeWidth,
  opacity,
  onStrokeWidthChange,
  onOpacityChange,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="floating-settings-modal">
      <div className="floating-settings-modal__header">
        <span className="floating-settings-modal__title">설정</span>
        <button className="floating-settings-modal__close" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="floating-settings-modal__section">
        <div className="floating-settings-modal__row">
          <span className="floating-settings-modal__label">두께</span>
          <span className="floating-settings-modal__value">{strokeWidth}px</span>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={[strokeWidth]}
          onValueChange={([v]) => onStrokeWidthChange(v)}
          className="w-full"
        />
      </div>

      <div className="floating-settings-modal__section">
        <div className="floating-settings-modal__row">
          <span className="floating-settings-modal__label">투명도</span>
          <span className="floating-settings-modal__value">{Math.round(opacity * 100)}%</span>
        </div>
        <Slider
          min={5}
          max={100}
          step={1}
          value={[Math.round(opacity * 100)]}
          onValueChange={([v]) => onOpacityChange(v / 100)}
          className="w-full"
        />
      </div>
    </div>
  );
}
