import { useState, useRef, useEffect, useCallback } from "react";
import {
  MousePointer2,
  Pen,
  Highlighter,
  Pencil,
  Eraser,
  Minus,
  Spline,
  CornerDownRight,
  Type,
  X,
} from "lucide-react";
import type {
  ToolMode,
  DrawSubTool,
  LineSubTool,
  DrawingConfig,
  LineConfig,
  TextConfig,
} from "./types";
import { COLOR_PRESETS, FONT_OPTIONS } from "./types";

// ─── Sub-tool definitions ───────────────────────────────────────────────────

interface SubToolDef {
  id: string;
  label: string;
  icon: typeof Pen;
}

const DRAW_SUB_TOOLS: SubToolDef[] = [
  { id: "pencil", label: "연필", icon: Pencil },
  { id: "marker", label: "마커", icon: Pen },
  { id: "highlighter", label: "형광펜", icon: Highlighter },
];

const LINE_SUB_TOOLS: SubToolDef[] = [
  { id: "straight", label: "직선", icon: Minus },
  { id: "curve", label: "곡선", icon: Spline },
  { id: "polyline", label: "꺾인선", icon: CornerDownRight },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface CanvaToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  drawConfig: DrawingConfig;
  onDrawConfigChange: (config: DrawingConfig) => void;
  lineConfig: LineConfig;
  onLineConfigChange: (config: LineConfig) => void;
  textConfig: TextConfig;
  onTextConfigChange: (config: TextConfig) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CanvaToolbar({
  toolMode,
  onToolModeChange,
  drawConfig,
  onDrawConfigChange,
  lineConfig,
  onLineConfigChange,
  textConfig,
  onTextConfigChange,
}: CanvaToolbarProps) {
  const [expandedMenu, setExpandedMenu] = useState<"draw" | "line" | "text" | null>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  // Close submenu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) {
        // Check if click is inside toolbar
        const toolbar = submenuRef.current.closest(".canva-toolbar");
        if (toolbar && !toolbar.contains(e.target as Node)) {
          setExpandedMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToolClick = useCallback(
    (mode: ToolMode, menu?: "draw" | "line" | "text") => {
      onToolModeChange(mode);
      if (menu) {
        setExpandedMenu((prev) => (prev === menu ? null : menu));
      } else {
        setExpandedMenu(null);
      }
    },
    [onToolModeChange],
  );

  // ─── Main tool buttons ────────────────────────────────────────────

  const tools: {
    id: ToolMode;
    icon: typeof Pen;
    label: string;
    menu?: "draw" | "line" | "text";
    indicator?: string;
  }[] = [
    { id: "select", icon: MousePointer2, label: "선택" },
    { id: "draw", icon: Pen, label: "드로잉", menu: "draw", indicator: drawConfig.color },
    { id: "eraser", icon: Eraser, label: "지우개" },
    { id: "line", icon: Minus, label: "선", menu: "line", indicator: lineConfig.color },
    { id: "text", icon: Type, label: "텍스트", menu: "text" },
  ];

  return (
    <div className="canva-toolbar">
      {/* Icon strip */}
      <div className="canva-toolbar__strip">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`canva-toolbar__btn ${
              toolMode === tool.id ? "canva-toolbar__btn--active" : ""
            }`}
            onClick={() => handleToolClick(tool.id, tool.menu)}
            title={tool.label}
          >
            <tool.icon className="canva-toolbar__btn-icon" />
            <span className="canva-toolbar__btn-label">{tool.label}</span>
            {tool.indicator && toolMode === tool.id && (
              <span
                className="canva-toolbar__color-dot"
                style={{ backgroundColor: tool.indicator }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Expanded sub-menu */}
      {expandedMenu && (
        <div ref={submenuRef} className="canva-toolbar__submenu">
          <button
            className="canva-toolbar__submenu-close"
            onClick={() => setExpandedMenu(null)}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* ── Draw sub-tools ── */}
          {expandedMenu === "draw" && (
            <div className="canva-toolbar__submenu-content">
              <span className="canva-toolbar__submenu-title">펜 종류</span>
              <div className="canva-toolbar__subtool-list">
                {DRAW_SUB_TOOLS.map((st) => (
                  <button
                    key={st.id}
                    className={`canva-toolbar__subtool-btn ${
                      drawConfig.subTool === st.id
                        ? "canva-toolbar__subtool-btn--active"
                        : ""
                    }`}
                    onClick={() =>
                      onDrawConfigChange({
                        ...drawConfig,
                        subTool: st.id as DrawSubTool,
                      })
                    }
                  >
                    <st.icon className="h-5 w-5" />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* Color */}
              <span className="canva-toolbar__submenu-title">색상</span>
              <div className="canva-toolbar__color-grid">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    className={`canva-toolbar__color-swatch ${
                      drawConfig.color === c ? "canva-toolbar__color-swatch--active" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => onDrawConfigChange({ ...drawConfig, color: c })}
                  />
                ))}
              </div>
              <div className="canva-toolbar__custom-color-row">
                <input
                  type="color"
                  value={drawConfig.color}
                  onChange={(e) =>
                    onDrawConfigChange({ ...drawConfig, color: e.target.value })
                  }
                  className="canva-toolbar__color-input"
                />
                <span className="canva-toolbar__color-hex">{drawConfig.color}</span>
              </div>

              {/* Sliders */}
              <div className="canva-toolbar__slider-section">
                <div className="canva-toolbar__slider-row">
                  <span className="canva-toolbar__slider-label">두께</span>
                  <input
                    type="range"
                    min={1}
                    max={80}
                    value={drawConfig.size}
                    onChange={(e) =>
                      onDrawConfigChange({ ...drawConfig, size: +e.target.value })
                    }
                    className="canva-toolbar__range"
                  />
                  <span className="canva-toolbar__slider-value">{drawConfig.size}</span>
                </div>
                <div className="canva-toolbar__slider-row">
                  <span className="canva-toolbar__slider-label">투명도</span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={Math.round(drawConfig.opacity * 100)}
                    onChange={(e) =>
                      onDrawConfigChange({ ...drawConfig, opacity: +e.target.value / 100 })
                    }
                    className="canva-toolbar__range"
                  />
                  <span className="canva-toolbar__slider-value">
                    {Math.round(drawConfig.opacity * 100)}
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div className="canva-toolbar__stroke-preview">
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <line
                    x1="20"
                    y1="20"
                    x2="180"
                    y2="20"
                    stroke={drawConfig.color}
                    strokeWidth={Math.min(drawConfig.size, 20)}
                    strokeLinecap="round"
                    opacity={drawConfig.opacity}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* ── Line sub-tools ── */}
          {expandedMenu === "line" && (
            <div className="canva-toolbar__submenu-content">
              <span className="canva-toolbar__submenu-title">선 종류</span>
              <div className="canva-toolbar__subtool-list">
                {LINE_SUB_TOOLS.map((st) => (
                  <button
                    key={st.id}
                    className={`canva-toolbar__subtool-btn ${
                      lineConfig.subTool === st.id
                        ? "canva-toolbar__subtool-btn--active"
                        : ""
                    }`}
                    onClick={() =>
                      onLineConfigChange({
                        ...lineConfig,
                        subTool: st.id as LineSubTool,
                      })
                    }
                  >
                    <st.icon className="h-5 w-5" />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* Color */}
              <span className="canva-toolbar__submenu-title">색상</span>
              <div className="canva-toolbar__color-grid">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    className={`canva-toolbar__color-swatch ${
                      lineConfig.color === c ? "canva-toolbar__color-swatch--active" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => onLineConfigChange({ ...lineConfig, color: c })}
                  />
                ))}
              </div>

              {/* Sliders */}
              <div className="canva-toolbar__slider-section">
                <div className="canva-toolbar__slider-row">
                  <span className="canva-toolbar__slider-label">두께</span>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={lineConfig.size}
                    onChange={(e) =>
                      onLineConfigChange({ ...lineConfig, size: +e.target.value })
                    }
                    className="canva-toolbar__range"
                  />
                  <span className="canva-toolbar__slider-value">{lineConfig.size}</span>
                </div>
                <div className="canva-toolbar__slider-row">
                  <span className="canva-toolbar__slider-label">투명도</span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={Math.round(lineConfig.opacity * 100)}
                    onChange={(e) =>
                      onLineConfigChange({ ...lineConfig, opacity: +e.target.value / 100 })
                    }
                    className="canva-toolbar__range"
                  />
                  <span className="canva-toolbar__slider-value">
                    {Math.round(lineConfig.opacity * 100)}
                  </span>
                </div>
              </div>

              <p className="canva-toolbar__hint">
                {lineConfig.subTool === "polyline"
                  ? "클릭으로 점을 찍고, 더블클릭으로 완성하세요."
                  : lineConfig.subTool === "curve"
                  ? "시작점에서 끝점까지 드래그하세요."
                  : "시작점에서 끝점까지 드래그하세요."}
              </p>
            </div>
          )}

          {/* ── Text sub-tools ── */}
          {expandedMenu === "text" && (
            <div className="canva-toolbar__submenu-content">
              <span className="canva-toolbar__submenu-title">텍스트 설정</span>

              {/* Font family */}
              <div className="canva-toolbar__text-field">
                <span className="canva-toolbar__field-label">폰트</span>
                <select
                  value={textConfig.fontFamily}
                  onChange={(e) =>
                    onTextConfigChange({ ...textConfig, fontFamily: e.target.value })
                  }
                  className="canva-toolbar__select"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font size */}
              <div className="canva-toolbar__slider-row">
                <span className="canva-toolbar__slider-label">크기</span>
                <input
                  type="range"
                  min={10}
                  max={120}
                  value={textConfig.fontSize}
                  onChange={(e) =>
                    onTextConfigChange({ ...textConfig, fontSize: +e.target.value })
                  }
                  className="canva-toolbar__range"
                />
                <span className="canva-toolbar__slider-value">{textConfig.fontSize}px</span>
              </div>

              {/* Bold / Italic */}
              <div className="canva-toolbar__text-options">
                <button
                  className={`canva-toolbar__option-btn ${
                    textConfig.bold ? "canva-toolbar__option-btn--active" : ""
                  }`}
                  onClick={() =>
                    onTextConfigChange({ ...textConfig, bold: !textConfig.bold })
                  }
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`canva-toolbar__option-btn ${
                    textConfig.italic ? "canva-toolbar__option-btn--active" : ""
                  }`}
                  onClick={() =>
                    onTextConfigChange({ ...textConfig, italic: !textConfig.italic })
                  }
                >
                  <em>I</em>
                </button>
              </div>

              {/* Color */}
              <span className="canva-toolbar__submenu-title">색상</span>
              <div className="canva-toolbar__color-grid">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    className={`canva-toolbar__color-swatch ${
                      textConfig.color === c ? "canva-toolbar__color-swatch--active" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => onTextConfigChange({ ...textConfig, color: c })}
                  />
                ))}
              </div>

              <p className="canva-toolbar__hint">
                캔버스 빈 곳을 클릭하면 텍스트가 생성됩니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
