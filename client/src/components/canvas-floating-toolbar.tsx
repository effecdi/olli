import { useState, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import type { DrawingLayer } from "./drawing-canvas";
import "./canvas-floating-toolbar.scss";

// ─── Layer type labels ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  drawing: "드로잉",
  straight: "직선",
  curve: "곡선",
  polyline: "꺾인선",
  text: "텍스트",
  eraser: "지우개",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface CanvasFloatingToolbarProps {
  layer: DrawingLayer;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onOpacityChange: (opacity: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CanvasFloatingToolbar({
  layer,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onOpacityChange,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onClose,
}: CanvasFloatingToolbarProps) {
  const [showOpacity, setShowOpacity] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const opacityRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const isEraser = layer.type === "eraser";

  // Close popups on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (opacityRef.current && !opacityRef.current.contains(e.target as Node)) {
        setShowOpacity(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close popups when layer changes
  useEffect(() => {
    setShowOpacity(false);
    setShowMore(false);
  }, [layer.id]);

  const opacityPercent = Math.round((layer.opacity ?? 1) * 100);

  return (
    <div className="canvas-floating-toolbar" onClick={(e) => e.stopPropagation()}>
      {/* Type label */}
      <span className="canvas-floating-toolbar__label">
        {TYPE_LABELS[layer.type] || layer.type}
      </span>

      <div className="canvas-floating-toolbar__divider" />

      {/* Opacity (not for eraser) */}
      {!isEraser && (
        <div ref={opacityRef} className="canvas-floating-toolbar__opacity-wrap">
          <button
            className={`canvas-floating-toolbar__btn ${showOpacity ? "canvas-floating-toolbar__btn--active" : ""}`}
            onClick={() => {
              setShowOpacity(!showOpacity);
              setShowMore(false);
            }}
            title="불투명도"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>

          {showOpacity && (
            <div className="canvas-floating-toolbar__popup canvas-floating-toolbar__popup--opacity">
              <div className="canvas-floating-toolbar__opacity-label">
                <span>불투명도</span>
                <span className="canvas-floating-toolbar__opacity-value">{opacityPercent}%</span>
              </div>
              <input
                type="range"
                className="canvas-floating-toolbar__opacity-slider"
                min={5}
                max={100}
                value={opacityPercent}
                onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              />
            </div>
          )}
        </div>
      )}

      {/* Visibility */}
      <button
        className={`canvas-floating-toolbar__btn ${!layer.visible ? "canvas-floating-toolbar__btn--active" : ""}`}
        onClick={onToggleVisibility}
        title={layer.visible ? "숨기기" : "보이기"}
      >
        {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>

      {/* Duplicate (not for eraser) */}
      {!isEraser && (
        <button
          className="canvas-floating-toolbar__btn"
          onClick={onDuplicate}
          title="복제"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Delete */}
      <button
        className="canvas-floating-toolbar__btn canvas-floating-toolbar__btn--danger"
        onClick={onDelete}
        title="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="canvas-floating-toolbar__divider" />

      {/* More (z-order) */}
      <div ref={moreRef} className="canvas-floating-toolbar__more-wrap">
        <button
          className={`canvas-floating-toolbar__btn ${showMore ? "canvas-floating-toolbar__btn--active" : ""}`}
          onClick={() => {
            setShowMore(!showMore);
            setShowOpacity(false);
          }}
          title="더보기"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {showMore && (
          <div className="canvas-floating-toolbar__popup canvas-floating-toolbar__popup--more">
            <button
              className="canvas-floating-toolbar__popup-item"
              onClick={() => { onBringToFront(); setShowMore(false); }}
            >
              <ChevronsUp className="h-4 w-4" />
              <span>맨 앞으로</span>
            </button>
            <button
              className="canvas-floating-toolbar__popup-item"
              onClick={() => { onBringForward(); setShowMore(false); }}
            >
              <ArrowUp className="h-4 w-4" />
              <span>앞으로</span>
            </button>
            <button
              className="canvas-floating-toolbar__popup-item"
              onClick={() => { onSendBackward(); setShowMore(false); }}
            >
              <ArrowDown className="h-4 w-4" />
              <span>뒤로</span>
            </button>
            <button
              className="canvas-floating-toolbar__popup-item"
              onClick={() => { onSendToBack(); setShowMore(false); }}
            >
              <ChevronsDown className="h-4 w-4" />
              <span>맨 뒤로</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
