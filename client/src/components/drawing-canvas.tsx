import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type BrushType =
  | "ballpoint"
  | "calligraphy"
  | "highlighter"
  | "pencil"
  | "marker"
  | "watercolor";

export interface DrawingToolState {
  tool: "brush" | "eraser" | "line" | "text";
  brushType: BrushType;
  color: string;
  size: number; // 1-100
  opacity: number; // 0-1
}

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
  redo: () => void;
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
  onStrokeEnd?: () => void;
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

/**
 * Returns the effective line width for a given brush type, base size, and pressure.
 */
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

/**
 * Returns the effective alpha for a given brush type and base opacity.
 */
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

/**
 * Configures the canvas context stroke style for a given brush.
 */
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

// ─── Component ─────────────────────────────────────────────────────────────

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ width, height, toolState, backgroundImage, className, onStrokeEnd, onRequestTextInput }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawLayerRef = useRef<HTMLCanvasElement | null>(null);
    const historyRef = useRef<ImageData[]>([]);
    const futureRef = useRef<ImageData[]>([]);
    const MAX_HISTORY = 30;

    const isDrawingRef = useRef(false);
    const pointsRef = useRef<Point[]>([]);
    const lastPointRef = useRef<Point | null>(null);

    // Line tool refs
    const lineStartRef = useRef<Point | null>(null);
    const preStrokeImageRef = useRef<ImageData | null>(null);

    // Touch optimization: track active touch id
    const activeTouchIdRef = useRef<number | null>(null);

    // Initialize off-screen draw layer
    useEffect(() => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      drawLayerRef.current = offscreen;
    }, [width, height]);

    // Composite final canvas = background + draw layer
    const composite = useCallback(() => {
      const canvas = canvasRef.current;
      const drawLayer = drawLayerRef.current;
      if (!canvas || !drawLayer) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Draw background image if provided
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }

      // Draw the drawing layer on top
      ctx.drawImage(drawLayer, 0, 0);
    }, [width, height, backgroundImage]);

    // Re-composite when background changes
    useEffect(() => {
      composite();
    }, [composite]);

    // Save current state to history
    const saveToHistory = useCallback(() => {
      const drawLayer = drawLayerRef.current;
      if (!drawLayer) return;
      const ctx = drawLayer.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, width, height);
      historyRef.current = [
        ...historyRef.current.slice(-(MAX_HISTORY - 1)),
        imageData,
      ];
      futureRef.current = [];
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
        // Text tool: delegate to external text input handler
        if (toolState.tool === "text") {
          onRequestTextInput?.(point.x, point.y);
          return;
        }

        isDrawingRef.current = true;
        pointsRef.current = [point];
        lastPointRef.current = point;

        // Save state before stroke
        saveToHistory();

        const drawLayer = drawLayerRef.current;
        if (!drawLayer) return;
        const ctx = drawLayer.getContext("2d");
        if (!ctx) return;

        // Line tool: save start point and snapshot for preview
        if (toolState.tool === "line") {
          lineStartRef.current = point;
          preStrokeImageRef.current = ctx.getImageData(0, 0, width, height);
          composite();
          return;
        }

        if (toolState.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, toolState.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const lw = getLineWidth(toolState.brushType, toolState.size, point.pressure);
          const alpha = getAlpha(toolState.brushType, toolState.opacity, point.pressure);
          configureBrushCtx(ctx, toolState.brushType, toolState.color, alpha, lw);

          // Draw a dot for single click
          ctx.beginPath();
          ctx.arc(point.x, point.y, lw / 2, 0, Math.PI * 2);
          ctx.fillStyle = toolState.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }

        composite();
      },
      [toolState, saveToHistory, composite, width, height, onRequestTextInput],
    );

    const continueStroke = useCallback(
      (point: Point) => {
        if (!isDrawingRef.current) return;

        const drawLayer = drawLayerRef.current;
        if (!drawLayer) return;
        const ctx = drawLayer.getContext("2d");
        if (!ctx) return;

        // Line tool: restore snapshot then draw preview line
        if (toolState.tool === "line") {
          const start = lineStartRef.current;
          const snapshot = preStrokeImageRef.current;
          if (!start || !snapshot) return;

          ctx.putImageData(snapshot, 0, 0);
          ctx.save();
          ctx.strokeStyle = toolState.color;
          ctx.lineWidth = toolState.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = toolState.opacity;
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

        if (toolState.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
          ctx.lineWidth = toolState.size;
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
          const lw = getLineWidth(toolState.brushType, toolState.size, point.pressure);
          const alpha = getAlpha(toolState.brushType, toolState.opacity, point.pressure);
          configureBrushCtx(ctx, toolState.brushType, toolState.color, alpha, lw);

          // Smooth curve drawing with quadratic bezier
          if (pts.length >= 3) {
            const prev = pts[pts.length - 3];
            const cp = pts[pts.length - 2];
            const cur = point;
            const mid1 = midPoint(prev, cp);
            const mid2 = midPoint(cp, cur);

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
      [toolState, composite],
    );

    const endStroke = useCallback(() => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      // Line tool: the final line is already drawn in continueStroke, just clean up refs
      if (toolState.tool === "line") {
        lineStartRef.current = null;
        preStrokeImageRef.current = null;
      }

      pointsRef.current = [];
      lastPointRef.current = null;

      // Reset composite operation
      const drawLayer = drawLayerRef.current;
      if (drawLayer) {
        const ctx = drawLayer.getContext("2d");
        if (ctx) {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }
      }

      composite();
      onStrokeEnd?.();
    }, [composite, onStrokeEnd, toolState.tool]);

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
        if (!isDrawingRef.current) return;
        const pt = getCanvasPoint(e.clientX, e.clientY);
        continueStroke(pt);
      },
      [getCanvasPoint, continueStroke],
    );

    const handleMouseUp = useCallback(() => {
      endStroke();
    }, [endStroke]);

    // ─── Touch event handlers (optimized) ───

    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // Prevent scroll & zoom
        if (activeTouchIdRef.current !== null) return; // Only track one finger

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

        // Find the active touch
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

        // Throttle touch moves for performance (skip if too fast)
        const last = pointsRef.current[pointsRef.current.length - 1];
        if (last) {
          const dx = pt.x - last.x;
          const dy = pt.y - last.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.5) return; // Skip very small movements
        }

        continueStroke(pt);
      },
      [getCanvasPoint, continueStroke],
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        // Check if our tracked touch ended
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
        clear: () => {
          const drawLayer = drawLayerRef.current;
          if (!drawLayer) return;
          const ctx = drawLayer.getContext("2d");
          if (!ctx) return;
          saveToHistory();
          ctx.clearRect(0, 0, width, height);
          composite();
        },
        undo: () => {
          const hist = historyRef.current;
          if (hist.length === 0) return;
          const drawLayer = drawLayerRef.current;
          if (!drawLayer) return;
          const ctx = drawLayer.getContext("2d");
          if (!ctx) return;

          // Save current to future
          futureRef.current.push(ctx.getImageData(0, 0, width, height));
          // Restore last
          const prev = hist.pop()!;
          ctx.putImageData(prev, 0, 0);
          composite();
        },
        redo: () => {
          const fut = futureRef.current;
          if (fut.length === 0) return;
          const drawLayer = drawLayerRef.current;
          if (!drawLayer) return;
          const ctx = drawLayer.getContext("2d");
          if (!ctx) return;

          // Save current to history
          historyRef.current.push(ctx.getImageData(0, 0, width, height));
          // Restore future
          const next = fut.pop()!;
          ctx.putImageData(next, 0, 0);
          composite();
        },
        exportImage: (format = "png") => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          return canvas.toDataURL(`image/${format}`);
        },
        exportMask: () => {
          // Export the drawing layer only (for AI inpainting mask)
          const drawLayer = drawLayerRef.current;
          if (!drawLayer) return null;

          const maskCanvas = document.createElement("canvas");
          maskCanvas.width = width;
          maskCanvas.height = height;
          const ctx = maskCanvas.getContext("2d");
          if (!ctx) return null;

          // Convert drawn areas to white on black background
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);

          const drawCtx = drawLayer.getContext("2d");
          if (!drawCtx) return null;

          const imgData = drawCtx.getImageData(0, 0, width, height);
          const maskData = ctx.getImageData(0, 0, width, height);

          for (let i = 0; i < imgData.data.length; i += 4) {
            if (imgData.data[i + 3] > 0) {
              // Any drawn pixel becomes white in mask
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
          const drawLayer = drawLayerRef.current;
          if (!drawLayer) return;
          const ctx = drawLayer.getContext("2d");
          if (!ctx) return;

          saveToHistory();

          ctx.save();
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          ctx.textBaseline = "top";

          // Support multi-line text
          const lines = text.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, x, y + i * (fontSize * 1.2));
          });

          ctx.restore();
          composite();
        },
      }),
      [width, height, composite, saveToHistory],
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
