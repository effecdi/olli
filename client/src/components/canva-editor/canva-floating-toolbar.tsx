import { useState, useRef, useEffect } from "react";
import {
  Palette,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import type { FabricObject } from "fabric";
import { COLOR_PRESETS } from "./types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface CanvaFloatingToolbarProps {
  x: number;
  y: number;
  selectedObj: FabricObject;
  onColorChange: (color: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CanvaFloatingToolbar({
  x,
  y,
  selectedObj,
  onColorChange,
  onDuplicate,
  onDelete,
  onLock,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: CanvaFloatingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const isLocked = selectedObj.lockMovementX;

  // Close popups on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close popups when selection changes
  useEffect(() => {
    setShowColorPicker(false);
    setShowMore(false);
  }, [selectedObj]);

  // Get current color
  const currentColor =
    selectedObj.type === "path" || selectedObj.type === "line" || selectedObj.type === "polyline"
      ? (selectedObj.stroke as string) || "#000000"
      : (selectedObj.fill as string) || "#000000";

  return (
    <div
      className="canva-floating-toolbar"
      style={{
        left: x,
        top: Math.max(y, 8),
        transform: "translateX(-50%)",
      }}
    >
      {/* AI Button */}
      <button
        className="canva-floating-toolbar__btn canva-floating-toolbar__btn--ai"
        title="Canva AI에게 물어보기"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      <div className="canva-floating-toolbar__divider" />

      {/* Color */}
      <div ref={colorRef} className="canva-floating-toolbar__color-wrap">
        <button
          className="canva-floating-toolbar__btn"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowMore(false);
          }}
          title="색상 변경"
        >
          <Palette className="h-3.5 w-3.5" />
          <span
            className="canva-floating-toolbar__color-indicator"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="canva-floating-toolbar__popup canva-floating-toolbar__popup--color">
            <div className="canva-floating-toolbar__popup-grid">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`canva-floating-toolbar__popup-swatch ${
                    currentColor === c ? "canva-floating-toolbar__popup-swatch--active" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    onColorChange(c);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                onColorChange(e.target.value);
              }}
              className="canva-floating-toolbar__popup-custom"
            />
          </div>
        )}
      </div>

      {/* Lock */}
      <button
        className={`canva-floating-toolbar__btn ${
          isLocked ? "canva-floating-toolbar__btn--active" : ""
        }`}
        onClick={onLock}
        title={isLocked ? "잠금 해제" : "잠금"}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Unlock className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Duplicate */}
      <button
        className="canva-floating-toolbar__btn"
        onClick={onDuplicate}
        title="복제"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>

      {/* Delete */}
      <button
        className="canva-floating-toolbar__btn canva-floating-toolbar__btn--danger"
        onClick={onDelete}
        title="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="canva-floating-toolbar__divider" />

      {/* More (z-index) */}
      <div ref={moreRef} className="canva-floating-toolbar__more-wrap">
        <button
          className="canva-floating-toolbar__btn"
          onClick={() => {
            setShowMore(!showMore);
            setShowColorPicker(false);
          }}
          title="더보기"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {showMore && (
          <div className="canva-floating-toolbar__popup canva-floating-toolbar__popup--more">
            <button
              className="canva-floating-toolbar__popup-item"
              onClick={() => {
                onBringToFront();
                setShowMore(false);
              }}
            >
              <ChevronsUp className="h-4 w-4" />
              <span>맨 앞으로</span>
            </button>
            <button
              className="canva-floating-toolbar__popup-item"
              onClick={() => {
                onBringForward();
                setShowMore(false);
              }}
            >
              <ArrowUp className="h-4 w-4" />
              <span>앞으로</span>
            </button>
            <button
              className="canva-floating-toolbar__popup-item"
              onClick={() => {
                onSendBackward();
                setShowMore(false);
              }}
            >
              <ArrowDown className="h-4 w-4" />
              <span>뒤로</span>
            </button>
            <button
              className="canva-floating-toolbar__popup-item"
              onClick={() => {
                onSendToBack();
                setShowMore(false);
              }}
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
