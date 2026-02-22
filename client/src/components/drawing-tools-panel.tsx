import { useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Pen,
  Highlighter,
  Pencil,
  Eraser,
  Download,
  X,
} from "lucide-react";
import type { DrawingToolState, BrushType, DrawingCanvasHandle } from "./drawing-canvas";
import "./drawing-tools-panel.scss";

// ─── Brush definitions ─────────────────────────────────────────────────────

interface BrushDef {
  id: BrushType;
  label: string;
  icon: typeof Pen;
  description: string;
}

const BRUSH_DEFS: BrushDef[] = [
  { id: "ballpoint", label: "볼펜", icon: Pen, description: "일반 볼펜 느낌" },
  { id: "calligraphy", label: "캘리그라피", icon: Pen, description: "붓펜 느낌" },
  { id: "highlighter", label: "형광펜", icon: Highlighter, description: "반투명 형광" },
  { id: "pencil", label: "연필", icon: Pencil, description: "부드러운 연필" },
  { id: "marker", label: "마커", icon: Pen, description: "굵은 마커펜" },
  { id: "watercolor", label: "수채화", icon: Pen, description: "수채화 번짐 느낌" },
];

// ─── Color presets ──────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff6600", "#ffcc00", "#33cc33", "#0099ff", "#6633cc",
  "#ff3366", "#ff9933", "#ffff00", "#00cc99", "#3366ff", "#9933ff",
  "#cc0000", "#cc6600", "#999900", "#006633", "#003399", "#330066",
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface DrawingToolsPanelProps {
  toolState: DrawingToolState;
  onToolStateChange: (state: DrawingToolState) => void;
  canvasRef?: React.RefObject<DrawingCanvasHandle | null>;
  onClose?: () => void;
}

export default function DrawingToolsPanel({
  toolState,
  onToolStateChange,
  canvasRef,
  onClose,
}: DrawingToolsPanelProps) {
  const [customColor, setCustomColor] = useState(toolState.color);

  const updateTool = useCallback(
    (partial: Partial<DrawingToolState>) => {
      onToolStateChange({ ...toolState, ...partial });
    },
    [toolState, onToolStateChange],
  );

  const selectBrush = useCallback(
    (brushType: BrushType) => {
      updateTool({ tool: "brush", brushType });
    },
    [updateTool],
  );

  const selectEraser = useCallback(() => {
    updateTool({ tool: "eraser" });
  }, [updateTool]);

  const handleColorChange = useCallback(
    (color: string) => {
      setCustomColor(color);
      updateTool({ color, tool: "brush" });
    },
    [updateTool],
  );

  const handleSizeChange = useCallback(
    (value: number[]) => {
      updateTool({ size: value[0] });
    },
    [updateTool],
  );

  const handleOpacityChange = useCallback(
    (value: number[]) => {
      updateTool({ opacity: value[0] / 100 });
    },
    [updateTool],
  );

  return (
    <div className="drawing-tools-panel">
      {/* Header */}
      <div className="drawing-tools-panel__header">
        <h3 className="drawing-tools-panel__title">드로잉 도구</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="drawing-tools-panel__close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Brush types */}
      <div className="drawing-tools-panel__section">
        <span className="drawing-tools-panel__section-label">펜 종류</span>
        <div className="drawing-tools-panel__brush-grid">
          {BRUSH_DEFS.map((brush) => (
            <button
              key={brush.id}
              className={`drawing-tools-panel__brush-btn ${
                toolState.tool === "brush" && toolState.brushType === brush.id
                  ? "drawing-tools-panel__brush-btn--active"
                  : ""
              }`}
              onClick={() => selectBrush(brush.id)}
              title={brush.description}
            >
              <brush.icon className="drawing-tools-panel__brush-icon" />
              <span className="drawing-tools-panel__brush-label">{brush.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Eraser */}
      <div className="drawing-tools-panel__section">
        <span className="drawing-tools-panel__section-label">지우개</span>
        <button
          className={`drawing-tools-panel__eraser-btn ${
            toolState.tool === "eraser"
              ? "drawing-tools-panel__eraser-btn--active"
              : ""
          }`}
          onClick={selectEraser}
        >
          <Eraser className="h-4 w-4" />
          <span>지우개</span>
        </button>
      </div>

      {/* Color palette */}
      <div className="drawing-tools-panel__section">
        <span className="drawing-tools-panel__section-label">색상</span>
        <div className="drawing-tools-panel__color-grid">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              className={`drawing-tools-panel__color-swatch ${
                toolState.color === color && toolState.tool === "brush"
                  ? "drawing-tools-panel__color-swatch--active"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          ))}
        </div>
        <div className="drawing-tools-panel__custom-color">
          <label className="drawing-tools-panel__custom-color-label">
            커스텀 색상
          </label>
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="drawing-tools-panel__color-input"
          />
        </div>
      </div>

      {/* Size slider */}
      <div className="drawing-tools-panel__section">
        <div className="drawing-tools-panel__slider-header">
          <span className="drawing-tools-panel__section-label">굵기</span>
          <span className="drawing-tools-panel__slider-value">{toolState.size}px</span>
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[toolState.size]}
          onValueChange={handleSizeChange}
          className="drawing-tools-panel__slider"
        />
        {/* Size preview */}
        <div className="drawing-tools-panel__size-preview">
          <div
            className="drawing-tools-panel__size-dot"
            style={{
              width: Math.min(toolState.size, 40),
              height: Math.min(toolState.size, 40),
              backgroundColor:
                toolState.tool === "eraser" ? "#999" : toolState.color,
              opacity: toolState.tool === "eraser" ? 0.5 : toolState.opacity,
            }}
          />
        </div>
      </div>

      {/* Opacity slider */}
      <div className="drawing-tools-panel__section">
        <div className="drawing-tools-panel__slider-header">
          <span className="drawing-tools-panel__section-label">불투명도</span>
          <span className="drawing-tools-panel__slider-value">
            {Math.round(toolState.opacity * 100)}%
          </span>
        </div>
        <Slider
          min={5}
          max={100}
          step={1}
          value={[Math.round(toolState.opacity * 100)]}
          onValueChange={handleOpacityChange}
          className="drawing-tools-panel__slider"
        />
      </div>

      {/* Actions */}
      <div className="drawing-tools-panel__section">
        <span className="drawing-tools-panel__section-label">작업</span>
        <div className="drawing-tools-panel__actions">
          <button
            className="drawing-tools-panel__action-btn"
            onClick={() => {
              const dataUrl = canvasRef?.current?.exportImage("png");
              if (dataUrl) {
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = "drawing.png";
                a.click();
              }
            }}
            title="이미지 다운로드"
          >
            <Download className="h-4 w-4" />
            <span>다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
}
