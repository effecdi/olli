import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type BrushType =
  | "ballpoint"
  | "calligraphy"
  | "highlighter"
  | "pencil"
  | "marker"
  | "watercolor";

export type DrawingLayerType = "drawing" | "straight" | "curve" | "polyline" | "text" | "eraser";

export interface DrawingLayer {
  id: string;
  type: DrawingLayerType;
  imageData: string;
  imageEl?: HTMLImageElement | null;
  visible: boolean;
  zIndex: number;
  label: string;
  opacity: number; // 0-1, per-layer opacity
}

export interface DrawingToolState {
  tool: "brush" | "eraser" | "line" | "text";
  brushType: BrushType;
  color: string;
  size: number; // 1-100
  opacity: number; // 0-1
  lineSubType?: "straight" | "curve" | "polyline";
}

export interface DrawingCanvasHandle {
  exportImage: (format?: "png" | "jpeg") => string | null;
  exportMask: () => string | null;
  getCanvas: () => HTMLCanvasElement | null;
  commitText: (x: number, y: number, text: string, fontSize: number, color: string) => void;
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  toolState: DrawingToolState;
  backgroundImage?: HTMLImageElement | null;
  className?: string;
  drawingLayers: DrawingLayer[];
  onLayerCreated?: (layer: DrawingLayer) => void;
  onRequestTextInput?: (x: number, y: number) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

function midPoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    pressure: (a.pressure + b.pressure) / 2,
    timestamp: (a.timestamp + b.timestamp) / 2,
  };
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getLineWidth(brush: BrushType, baseSize: number, pressure: number): number {
  switch (brush) {
    case "ballpoint":
      return baseSize * (0.6 + pressure * 0.4);
    case "calligraphy":
      return baseSize * (0.2 + pressure * 1.6);
    case "highlighter":
      return baseSize * 3;
    case "pencil":
      return baseSize * (0.5 + pressure * 0.3);
    case "marker":
      return baseSize * (0.8 + pressure * 0.4);
    case "watercolor":
      return baseSize * (1.0 + pressure * 0.8);
    default:
      return baseSize;
  }
}

function getAlpha(brush: BrushType, baseOpacity: number, pressure: number): number {
  switch (brush) {
    case "highlighter":
      return baseOpacity * 0.35;
    case "watercolor":
      return baseOpacity * (0.15 + pressure * 0.25);
    case "pencil":
      return baseOpacity * (0.4 + pressure * 0.4);
    default:
      return baseOpacity * (0.7 + pressure * 0.3);
  }
}

function configureBrushCtx(
  ctx: CanvasRenderingContext2D,
  brush: BrushType,
  color: string,
  alpha: number,
  lineWidth: number,
) {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = brush === "calligraphy" ? "butt" : "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.globalCompositeOperation = "source-over";

  if (brush === "highlighter") {
    ctx.lineCap = "square";
    ctx.globalCompositeOperation = "multiply";
  }
}

const LAYER_LABELS: Record<string, string> = {
  drawing: "드로잉",
  straight: "직선",
  curve: "곡선",
  polyline: "꺾인선",
  text: "텍스트",
  eraser: "지우개",
};

// ─── Component ─────────────────────────────────────────────────────────────

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ width, height, toolState, backgroundImage, className, drawingLayers, onLayerCreated, onRequestTextInput }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeStrokeRef = useRef<HTMLCanvasElement | null>(null);
    const drawingCompositeRef = useRef<HTMLCanvasElement | null>(null);

    const isDrawingRef = useRef(false);
    const pointsRef = useRef<Point[]>([]);
    const lastPointRef = useRef<Point | null>(null);

    // Line tool refs
    const lineStartRef = useRef<Point | null>(null);

    // Curve tool state machine: idle → click1 → click2 → click3
    const curveStateRef = useRef<{
      phase: "idle" | "p1" | "p2";
      p1: Point | null;
      p2: Point | null;
    }>({ phase: "idle", p1: null, p2: null });

    // Polyline tool: collect points, dblclick to finish
    const polylinePointsRef = useRef<Point[]>([]);
    const polylineActiveRef = useRef(false);

    // Touch optimization
    const activeTouchIdRef = useRef<number | null>(null);

    // Store latest drawingLayers ref for composite callback
    const drawingLayersRef = useRef(drawingLayers);
    drawingLayersRef.current = drawingLayers;

    // Store latest toolState ref
    const toolStateRef = useRef(toolState);
    toolStateRef.current = toolState;

    // Store callbacks refs to avoid stale closures
    const onLayerCreatedRef = useRef(onLayerCreated);
    onLayerCreatedRef.current = onLayerCreated;

    // Initialize off-screen canvases
    useEffect(() => {
      const activeStroke = document.createElement("canvas");
      activeStroke.width = width;
      activeStroke.height = height;
      activeStrokeRef.current = activeStroke;

      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = width;
      compositeCanvas.height = height;
      drawingCompositeRef.current = compositeCanvas;
    }, [width, height]);

    // Composite final canvas = background + drawing layers composite + active stroke
    const composite = useCallback(() => {
      const canvas = canvasRef.current;
      const activeStroke = activeStrokeRef.current;
      const compositeCanvas = drawingCompositeRef.current;
      if (!canvas || !activeStroke || !compositeCanvas) return;

      const ctx = canvas.getContext("2d");
      const compCtx = compositeCanvas.getContext("2d");
      if (!ctx || !compCtx) return;

      // 1. Clear main canvas
      ctx.clearRect(0, 0, width, height);

      // 2. Draw background
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }

      // 3. Clear composite canvas and render drawing layers
      compCtx.clearRect(0, 0, width, height);
      const layers = drawingLayersRef.current;
      if (layers && layers.length > 0) {
        const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
        for (const layer of sorted) {
          if (!layer.visible || !layer.imageEl) continue;
          compCtx.save();
          compCtx.globalAlpha = layer.opacity ?? 1;
          if (layer.type === "eraser") {
            compCtx.globalCompositeOperation = "destination-out";
          } else {
            compCtx.globalCompositeOperation = "source-over";
          }
          compCtx.drawImage(layer.imageEl, 0, 0);
          compCtx.restore();
        }
      }

      // 4. Draw composite onto main canvas
      ctx.drawImage(compositeCanvas, 0, 0);

      // 5. Draw active stroke on top
      ctx.drawImage(activeStroke, 0, 0);
    }, [width, height, backgroundImage]);

    // Re-composite when background or layers change
    useEffect(() => {
      composite();
    }, [composite, drawingLayers]);

    // ─── Layer creation helper ───

    const createLayerFromActiveStroke = useCallback((layerType: DrawingLayerType) => {
      const activeStroke = activeStrokeRef.current;
      if (!activeStroke) return;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width;
      exportCanvas.height = height;
      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) return;
      exportCtx.drawImage(activeStroke, 0, 0);

      // Check if anything was drawn
      const imgData = exportCtx.getImageData(0, 0, width, height);
      let hasContent = false;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0) { hasContent = true; break; }
      }
      if (!hasContent) return;

      const base64 = exportCanvas.toDataURL("image/png");
      const maxZ = drawingLayersRef.current.reduce((max, l) => Math.max(max, l.zIndex), 0);

      const newLayer: DrawingLayer = {
        id: generateId(),
        type: layerType,
        imageData: base64,
        imageEl: null,
        visible: true,
        zIndex: maxZ + 1,
        label: LAYER_LABELS[layerType] || layerType,
      };

      // Load imageEl
      const img = new Image();
      img.onload = () => {
        newLayer.imageEl = img;
        onLayerCreatedRef.current?.(newLayer);
      };
      img.src = base64;

      // Clear active stroke
      const asCtx = activeStroke.getContext("2d");
      if (asCtx) asCtx.clearRect(0, 0, width, height);
    }, [width, height]);

    // ─── Drawing logic ───

    const getCanvasPoint = useCallback(
      (clientX: number, clientY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };
        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
          pressure: 0.5,
          timestamp: Date.now(),
        };
      },
      [width, height],
    );

    const startStroke = useCallback(
      (point: Point) => {
        const ts = toolStateRef.current;

        // Text tool
        if (ts.tool === "text") {
          onRequestTextInput?.(point.x, point.y);
          return;
        }

        // Curve tool (3-click bezier)
        if (ts.tool === "line" && ts.lineSubType === "curve") {
          const state = curveStateRef.current;
          if (state.phase === "idle") {
            curveStateRef.current = { phase: "p1", p1: point, p2: null };
            // Draw start dot on active stroke
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = ts.color;
                ctx.globalAlpha = ts.opacity;
                ctx.beginPath();
                ctx.arc(point.x, point.y, Math.max(ts.size / 2, 3), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
              }
            }
            composite();
            return;
          }
          if (state.phase === "p1") {
            curveStateRef.current = { ...state, phase: "p2", p2: point };
            // Draw line from p1 to p2
            const as = activeStrokeRef.current;
            if (as && state.p1) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.beginPath();
                ctx.moveTo(state.p1.x, state.p1.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
            return;
          }
          if (state.phase === "p2" && state.p1 && state.p2) {
            // Click 3: control point → final curve
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.globalCompositeOperation = "source-over";
                ctx.beginPath();
                ctx.moveTo(state.p1.x, state.p1.y);
                ctx.quadraticCurveTo(point.x, point.y, state.p2.x, state.p2.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
            createLayerFromActiveStroke("curve");
            curveStateRef.current = { phase: "idle", p1: null, p2: null };
            return;
          }
          return;
        }

        // Polyline tool (multi-click + dblclick)
        if (ts.tool === "line" && ts.lineSubType === "polyline") {
          if (!polylineActiveRef.current) {
            polylineActiveRef.current = true;
            polylinePointsRef.current = [point];
            // Draw start dot
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = ts.color;
                ctx.globalAlpha = ts.opacity;
                ctx.beginPath();
                ctx.arc(point.x, point.y, Math.max(ts.size / 2, 3), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
              }
            }
            composite();
          } else {
            // Add point and draw accumulated segments
            polylinePointsRef.current.push(point);
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.globalCompositeOperation = "source-over";
                const pts = polylinePointsRef.current;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) {
                  ctx.lineTo(pts[k].x, pts[k].y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
          }
          return;
        }

        // Normal stroke start (brush, eraser, straight line)
        isDrawingRef.current = true;
        pointsRef.current = [point];
        lastPointRef.current = point;

        const activeStroke = activeStrokeRef.current;
        if (!activeStroke) return;
        const ctx = activeStroke.getContext("2d");
        if (!ctx) return;

        // Clear active stroke canvas for new stroke
        ctx.clearRect(0, 0, width, height);

        // Straight line tool: save start point
        if (ts.tool === "line") {
          lineStartRef.current = point;
          composite();
          return;
        }

        if (ts.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, ts.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const lw = getLineWidth(ts.brushType, ts.size, point.pressure);
          const alpha = getAlpha(ts.brushType, ts.opacity, point.pressure);
          configureBrushCtx(ctx, ts.brushType, ts.color, alpha, lw);

          ctx.beginPath();
          ctx.arc(point.x, point.y, lw / 2, 0, Math.PI * 2);
          ctx.fillStyle = ts.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }

        composite();
      },
      [width, height, composite, onRequestTextInput, createLayerFromActiveStroke],
    );

    const continueStroke = useCallback(
      (point: Point) => {
        const ts = toolStateRef.current;

        // Curve tool: mousemove preview
        if (ts.tool === "line" && ts.lineSubType === "curve") {
          const state = curveStateRef.current;
          if (state.phase === "p2" && state.p1 && state.p2) {
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.globalCompositeOperation = "source-over";
                ctx.beginPath();
                ctx.moveTo(state.p1.x, state.p1.y);
                ctx.quadraticCurveTo(point.x, point.y, state.p2.x, state.p2.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
          }
          return;
        }

        // Polyline tool: guideline from last point to cursor
        if (ts.tool === "line" && ts.lineSubType === "polyline" && polylineActiveRef.current) {
          const pts = polylinePointsRef.current;
          if (pts.length > 0) {
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.globalCompositeOperation = "source-over";
                // Draw accumulated segments
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) {
                  ctx.lineTo(pts[k].x, pts[k].y);
                }
                // Guide line to cursor
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
          }
          return;
        }

        if (!isDrawingRef.current) return;

        const activeStroke = activeStrokeRef.current;
        if (!activeStroke) return;
        const ctx = activeStroke.getContext("2d");
        if (!ctx) return;

        // Straight line tool: redraw preview from start to current
        if (ts.tool === "line") {
          const start = lineStartRef.current;
          if (!start) return;

          ctx.clearRect(0, 0, width, height);
          ctx.save();
          ctx.strokeStyle = ts.color;
          ctx.lineWidth = ts.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = ts.opacity;
          ctx.globalCompositeOperation = "source-over";
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.restore();
          composite();
          return;
        }

        pointsRef.current.push(point);
        const pts = pointsRef.current;

        if (ts.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
          ctx.lineWidth = ts.size;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          const prev = pts[pts.length - 2];
          if (prev) {
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          }
        } else {
          const lw = getLineWidth(ts.brushType, ts.size, point.pressure);
          const alpha = getAlpha(ts.brushType, ts.opacity, point.pressure);
          configureBrushCtx(ctx, ts.brushType, ts.color, alpha, lw);

          if (pts.length >= 3) {
            const prev = pts[pts.length - 3];
            const cp = pts[pts.length - 2];
            const mid1 = midPoint(prev, cp);
            const mid2 = midPoint(cp, point);

            ctx.beginPath();
            ctx.moveTo(mid1.x, mid1.y);
            ctx.quadraticCurveTo(cp.x, cp.y, mid2.x, mid2.y);
            ctx.stroke();
          } else if (pts.length === 2) {
            const prev = pts[0];
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          }
        }

        lastPointRef.current = point;
        composite();
      },
      [width, height, composite],
    );

    const endStroke = useCallback(() => {
      const ts = toolStateRef.current;

      // Curve and polyline tools don't use normal endStroke
      if (ts.tool === "line" && (ts.lineSubType === "curve" || ts.lineSubType === "polyline")) {
        return;
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      // Determine layer type
      let layerType: DrawingLayerType = "drawing";
      if (ts.tool === "line") {
        layerType = "straight";
      } else if (ts.tool === "eraser") {
        layerType = "eraser";
      }

      // Reset refs
      lineStartRef.current = null;
      pointsRef.current = [];
      lastPointRef.current = null;

      // Reset active stroke context
      const activeStroke = activeStrokeRef.current;
      if (activeStroke) {
        const ctx = activeStroke.getContext("2d");
        if (ctx) {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }
      }

      // Create layer from active stroke
      createLayerFromActiveStroke(layerType);
      composite();
    }, [composite, createLayerFromActiveStroke]);

    // ─── Double-click handler for polyline completion ───
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ts = toolStateRef.current;
        if (ts.tool === "line" && ts.lineSubType === "polyline" && polylineActiveRef.current) {
          e.preventDefault();
          e.stopPropagation();
          // Finalize polyline
          const pts = polylinePointsRef.current;
          if (pts.length >= 2) {
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = ts.color;
                ctx.lineWidth = ts.size;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.globalAlpha = ts.opacity;
                ctx.globalCompositeOperation = "source-over";
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) {
                  ctx.lineTo(pts[k].x, pts[k].y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
            composite();
            createLayerFromActiveStroke("polyline");
          } else {
            // Clear if only one point
            const as = activeStrokeRef.current;
            if (as) {
              const ctx = as.getContext("2d");
              if (ctx) ctx.clearRect(0, 0, width, height);
            }
            composite();
          }
          polylinePointsRef.current = [];
          polylineActiveRef.current = false;
        }
      },
      [width, height, composite, createLayerFromActiveStroke],
    );

    // ─── Mouse event handlers ───

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const pt = getCanvasPoint(e.clientX, e.clientY);
        startStroke(pt);
      },
      [getCanvasPoint, startStroke],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ts = toolStateRef.current;
        // For curve/polyline, always process mousemove for previews
        if (ts.tool === "line" && (ts.lineSubType === "curve" || ts.lineSubType === "polyline")) {
          const pt = getCanvasPoint(e.clientX, e.clientY);
          continueStroke(pt);
          return;
        }
        if (!isDrawingRef.current) return;
        const pt = getCanvasPoint(e.clientX, e.clientY);
        continueStroke(pt);
      },
      [getCanvasPoint, continueStroke],
    );

    const handleMouseUp = useCallback(() => {
      endStroke();
    }, [endStroke]);

    // ─── Touch event handlers ───

    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (activeTouchIdRef.current !== null) return;

        const touch = e.changedTouches[0];
        activeTouchIdRef.current = touch.identifier;

        const pt = getCanvasPoint(touch.clientX, touch.clientY);
        pt.pressure = (touch as any).force > 0 ? (touch as any).force : 0.5;
        startStroke(pt);
      },
      [getCanvasPoint, startStroke],
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (activeTouchIdRef.current === null) return;

        let touch: React.Touch | null = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
            touch = e.changedTouches[i];
            break;
          }
        }
        if (!touch) return;

        const pt = getCanvasPoint(touch.clientX, touch.clientY);
        pt.pressure = (touch as any).force > 0 ? (touch as any).force : 0.5;

        const last = pointsRef.current[pointsRef.current.length - 1];
        if (last) {
          const dx = pt.x - last.x;
          const dy = pt.y - last.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.5) return;
        }

        continueStroke(pt);
      },
      [getCanvasPoint, continueStroke],
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
            activeTouchIdRef.current = null;
            endStroke();
            break;
          }
        }
      },
      [endStroke],
    );

    // ─── Imperative handle ───

    useImperativeHandle(
      ref,
      () => ({
        exportImage: (format = "png") => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          return canvas.toDataURL(`image/${format}`);
        },
        exportMask: () => {
          // Export all drawing layers combined as mask
          const compositeCanvas = drawingCompositeRef.current;
          if (!compositeCanvas) return null;

          const maskCanvas = document.createElement("canvas");
          maskCanvas.width = width;
          maskCanvas.height = height;
          const ctx = maskCanvas.getContext("2d");
          if (!ctx) return null;

          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);

          const compCtx = compositeCanvas.getContext("2d");
          if (!compCtx) return null;

          const imgData = compCtx.getImageData(0, 0, width, height);
          const maskData = ctx.getImageData(0, 0, width, height);

          for (let i = 0; i < imgData.data.length; i += 4) {
            if (imgData.data[i + 3] > 0) {
              maskData.data[i] = 255;
              maskData.data[i + 1] = 255;
              maskData.data[i + 2] = 255;
              maskData.data[i + 3] = 255;
            }
          }

          ctx.putImageData(maskData, 0, 0);
          return maskCanvas.toDataURL("image/png");
        },
        getCanvas: () => canvasRef.current,
        commitText: (x: number, y: number, text: string, fontSize: number, color: string) => {
          const activeStroke = activeStrokeRef.current;
          if (!activeStroke) return;
          const ctx = activeStroke.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, width, height);
          ctx.save();
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          ctx.textBaseline = "top";

          const lines = text.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, x, y + i * (fontSize * 1.2));
          });

          ctx.restore();
          composite();
          createLayerFromActiveStroke("text");
        },
      }),
      [width, height, composite, createLayerFromActiveStroke],
    );

    // ─── Cursor style ───

    const cursorStyle =
      toolState.tool === "eraser"
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${toolState.size}' height='${toolState.size}'%3E%3Ccircle cx='${toolState.size / 2}' cy='${toolState.size / 2}' r='${toolState.size / 2 - 1}' fill='none' stroke='%23666' stroke-width='1'/%3E%3C/svg%3E") ${toolState.size / 2} ${toolState.size / 2}, crosshair`
        : toolState.tool === "text"
          ? "text"
          : "crosshair";

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    );
  },
);

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
