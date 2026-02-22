import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Canvas,
  PencilBrush,
  Line,
  Path,
  Polyline,
  Textbox,
  FabricObject,
  Point,
} from "fabric";
import CanvaToolbar from "./canva-toolbar";
import CanvaFloatingToolbar from "./canva-floating-toolbar";
import type {
  ToolMode,
  DrawingConfig,
  LineConfig,
  TextConfig,
  FloatingToolbarPos,
  CanvaEditorHandle,
  CanvaEditorProps,
} from "./types";
import "./canva-editor.scss";

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_HISTORY = 40;

// ─── Component ──────────────────────────────────────────────────────────────

const CanvaEditor = forwardRef<CanvaEditorHandle, CanvaEditorProps>(
  ({ width, height, className, backgroundImage, onObjectSelected }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Tool state
    const [toolMode, setToolMode] = useState<ToolMode>("select");
    const [drawConfig, setDrawConfig] = useState<DrawingConfig>({
      subTool: "pencil",
      color: "#000000",
      size: 4,
      opacity: 1,
    });
    const [lineConfig, setLineConfig] = useState<LineConfig>({
      subTool: "straight",
      color: "#000000",
      size: 3,
      opacity: 1,
    });
    const [textConfig, setTextConfig] = useState<TextConfig>({
      fontFamily: "Pretendard, Apple SD Gothic Neo, sans-serif",
      fontSize: 24,
      color: "#000000",
      bold: false,
      italic: false,
    });

    // Selection / floating toolbar
    const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null);
    const [floatingPos, setFloatingPos] = useState<FloatingToolbarPos>({
      x: 0,
      y: 0,
      visible: false,
    });

    // Undo/redo
    const historyRef = useRef<string[]>([]);
    const futureRef = useRef<string[]>([]);
    const skipSaveRef = useRef(false);

    // Line drawing refs
    const lineStartRef = useRef<Point | null>(null);
    const tempLineRef = useRef<Line | null>(null);
    const polyPointsRef = useRef<Point[]>([]);
    const tempPolyRef = useRef<Polyline | null>(null);

    // ─── Save to history ──────────────────────────────────────────────

    const saveHistory = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc || skipSaveRef.current) {
        skipSaveRef.current = false;
        return;
      }
      const json = JSON.stringify(fc.toJSON());
      historyRef.current = [
        ...historyRef.current.slice(-(MAX_HISTORY - 1)),
        json,
      ];
      futureRef.current = [];
    }, []);

    // ─── Init Fabric canvas ───────────────────────────────────────────

    useEffect(() => {
      if (!canvasElRef.current) return;

      const fc = new Canvas(canvasElRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
      });
      fabricRef.current = fc;

      // Save initial state
      historyRef.current = [JSON.stringify(fc.toJSON())];

      // ── Selection events ──
      const updateFloating = () => {
        const active = fc.getActiveObject();
        if (active) {
          setSelectedObj(active);
          const bound = active.getBoundingRect();
          const wrapperEl = wrapperRef.current;
          const canvasEl = canvasElRef.current;
          if (wrapperEl && canvasEl) {
            const wrapRect = wrapperEl.getBoundingClientRect();
            const canvasRect = canvasEl.getBoundingClientRect();
            const scaleX = canvasRect.width / width;
            const scaleY = canvasRect.height / height;
            const offsetX = canvasRect.left - wrapRect.left;
            const offsetY = canvasRect.top - wrapRect.top;

            setFloatingPos({
              x: offsetX + (bound.left + bound.width / 2) * scaleX,
              y: offsetY + bound.top * scaleY - 52,
              visible: true,
            });
          }
          onObjectSelected?.(active);
        } else {
          setSelectedObj(null);
          setFloatingPos((p) => ({ ...p, visible: false }));
          onObjectSelected?.(null);
        }
      };

      fc.on("selection:created", updateFloating);
      fc.on("selection:updated", updateFloating);
      fc.on("selection:cleared", () => {
        setSelectedObj(null);
        setFloatingPos((p) => ({ ...p, visible: false }));
        onObjectSelected?.(null);
      });
      fc.on("object:moving", updateFloating);
      fc.on("object:scaling", updateFloating);
      fc.on("object:rotating", updateFloating);

      // Save history on object modification
      fc.on("object:modified", () => saveHistory());
      fc.on("path:created", () => saveHistory());

      // Keyboard shortcuts
      const onKey = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

        if (e.key === "Delete" || e.key === "Backspace") {
          const objs = fc.getActiveObjects();
          if (objs.length > 0) {
            objs.forEach((o) => fc.remove(o));
            fc.discardActiveObject();
            fc.requestRenderAll();
            saveHistory();
          }
        }
      };
      window.addEventListener("keydown", onKey);

      return () => {
        window.removeEventListener("keydown", onKey);
        fc.dispose();
        fabricRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Resize canvas if dimensions change ───────────────────────────

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.setDimensions({ width, height });
      fc.requestRenderAll();
    }, [width, height]);

    // ─── Background image ─────────────────────────────────────────────

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          fc.backgroundImage = undefined;
          fc.requestRenderAll();
        };
        img.src = backgroundImage;
      }
    }, [backgroundImage]);

    // ─── Tool mode switching ──────────────────────────────────────────

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;

      // Reset canvas mode
      fc.isDrawingMode = false;
      fc.selection = true;
      fc.defaultCursor = "default";
      fc.hoverCursor = "move";

      // Clean up temp objects
      if (tempLineRef.current) {
        fc.remove(tempLineRef.current);
        tempLineRef.current = null;
      }
      lineStartRef.current = null;

      if (tempPolyRef.current) {
        fc.remove(tempPolyRef.current);
        tempPolyRef.current = null;
      }
      polyPointsRef.current = [];

      // Remove line/text mode event listeners
      fc.off("mouse:down", handleLineMouseDown as any);
      fc.off("mouse:move", handleLineMouseMove as any);
      fc.off("mouse:up", handleLineMouseUp as any);
      fc.off("mouse:down", handleTextMouseDown as any);

      // Make all objects selectable
      fc.forEachObject((o) => {
        o.selectable = true;
        o.evented = true;
      });

      switch (toolMode) {
        case "select":
          // Default selection mode - already set above
          break;

        case "draw":
          setupDrawingMode(fc);
          break;

        case "eraser":
          setupEraserMode(fc);
          break;

        case "line":
          setupLineMode(fc);
          break;

        case "text":
          setupTextMode(fc);
          break;
      }

      fc.requestRenderAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toolMode, drawConfig, lineConfig, textConfig]);

    // ─── Drawing mode setup ───────────────────────────────────────────

    const setupDrawingMode = useCallback(
      (fc: Canvas) => {
        fc.isDrawingMode = true;
        fc.selection = false;

        const brush = new PencilBrush(fc);
        brush.color = drawConfig.color;
        brush.width = drawConfig.size;

        // Brush characteristics per sub-tool
        switch (drawConfig.subTool) {
          case "pencil":
            brush.width = drawConfig.size;
            break;
          case "marker":
            brush.width = drawConfig.size * 2.5;
            break;
          case "highlighter":
            brush.width = drawConfig.size * 4;
            break;
        }

        fc.freeDrawingBrush = brush;
        fc.freeDrawingBrush.color = drawConfig.color;
        fc.freeDrawingBrush.width = brush.width;

        // Handle opacity on path creation
        const onPathCreated = (e: any) => {
          const path = e.path as Path;
          if (!path) return;

          let effectiveOpacity = drawConfig.opacity;
          if (drawConfig.subTool === "highlighter") {
            effectiveOpacity = drawConfig.opacity * 0.4;
          }
          path.set({ opacity: effectiveOpacity });
          fc.requestRenderAll();
        };

        fc.off("path:created", onPathCreated);
        fc.on("path:created", onPathCreated);
      },
      [drawConfig],
    );

    // ─── Eraser mode ──────────────────────────────────────────────────

    const setupEraserMode = useCallback((fc: Canvas) => {
      fc.selection = false;
      fc.defaultCursor = "crosshair";
      fc.hoverCursor = "crosshair";

      // In eraser mode, clicking an object removes it
      fc.forEachObject((o) => {
        o.selectable = true;
        o.evented = true;
      });

      const onMouseDown = (opt: any) => {
        const target = opt.target;
        if (target) {
          fc.remove(target);
          fc.requestRenderAll();
          saveHistory();
        }
      };
      fc.on("mouse:down", onMouseDown);
    }, [saveHistory]);

    // ─── Line mode ───────────────────────────────────────────────────

    const handleLineMouseDown = useCallback(
      (opt: any) => {
        const fc = fabricRef.current;
        if (!fc) return;
        const pointer = fc.getScenePoint(opt.e);

        if (lineConfig.subTool === "polyline") {
          polyPointsRef.current.push(new Point(pointer.x, pointer.y));

          if (tempPolyRef.current) {
            fc.remove(tempPolyRef.current);
          }

          if (polyPointsRef.current.length >= 2) {
            const pts = polyPointsRef.current.map((p) => ({ x: p.x, y: p.y }));
            const pl = new Polyline(pts, {
              fill: "transparent",
              stroke: lineConfig.color,
              strokeWidth: lineConfig.size,
              opacity: lineConfig.opacity,
              selectable: false,
              evented: false,
              objectCaching: false,
            });
            tempPolyRef.current = pl;
            fc.add(pl);
            fc.requestRenderAll();
          }
          return;
        }

        // Straight or curve line
        lineStartRef.current = new Point(pointer.x, pointer.y);

        const line = new Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: lineConfig.color,
            strokeWidth: lineConfig.size,
            opacity: lineConfig.opacity,
            selectable: false,
            evented: false,
          },
        );
        tempLineRef.current = line;
        fc.add(line);
      },
      [lineConfig],
    );

    const handleLineMouseMove = useCallback(
      (opt: any) => {
        const fc = fabricRef.current;
        if (!fc || !lineStartRef.current || !tempLineRef.current) return;

        const pointer = fc.getScenePoint(opt.e);

        if (lineConfig.subTool === "curve") {
          // For curve, update end point (simplified preview)
          tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
        } else {
          tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
        }
        fc.requestRenderAll();
      },
      [lineConfig.subTool],
    );

    const handleLineMouseUp = useCallback(
      (opt: any) => {
        const fc = fabricRef.current;
        if (!fc) return;

        if (lineConfig.subTool === "polyline") return; // Polyline ends on dblclick

        if (!lineStartRef.current || !tempLineRef.current) return;

        const pointer = fc.getScenePoint(opt.e);

        // Remove temp line
        fc.remove(tempLineRef.current);

        const start = lineStartRef.current;

        if (lineConfig.subTool === "curve") {
          // Create a quadratic bezier path
          const midX = (start.x + pointer.x) / 2;
          const midY = Math.min(start.y, pointer.y) - 50;
          const pathStr = `M ${start.x} ${start.y} Q ${midX} ${midY} ${pointer.x} ${pointer.y}`;
          const path = new Path(pathStr, {
            fill: "transparent",
            stroke: lineConfig.color,
            strokeWidth: lineConfig.size,
            opacity: lineConfig.opacity,
            selectable: true,
            evented: true,
          });
          fc.add(path);
        } else {
          // Straight line
          const finalLine = new Line(
            [start.x, start.y, pointer.x, pointer.y],
            {
              stroke: lineConfig.color,
              strokeWidth: lineConfig.size,
              opacity: lineConfig.opacity,
              selectable: true,
              evented: true,
            },
          );
          fc.add(finalLine);
        }

        lineStartRef.current = null;
        tempLineRef.current = null;
        fc.requestRenderAll();
        saveHistory();
      },
      [lineConfig, saveHistory],
    );

    const setupLineMode = useCallback(
      (fc: Canvas) => {
        fc.selection = false;
        fc.defaultCursor = "crosshair";
        fc.hoverCursor = "crosshair";

        fc.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });

        fc.on("mouse:down", handleLineMouseDown as any);
        fc.on("mouse:move", handleLineMouseMove as any);
        fc.on("mouse:up", handleLineMouseUp as any);

        // Double-click to finish polyline
        fc.on("mouse:dblclick", () => {
          if (lineConfig.subTool === "polyline" && polyPointsRef.current.length >= 2) {
            if (tempPolyRef.current) {
              tempPolyRef.current.set({ selectable: true, evented: true });
              fc.requestRenderAll();
              saveHistory();
            }
            polyPointsRef.current = [];
            tempPolyRef.current = null;
          }
        });
      },
      [handleLineMouseDown, handleLineMouseMove, handleLineMouseUp, lineConfig.subTool, saveHistory],
    );

    // ─── Text mode ───────────────────────────────────────────────────

    const handleTextMouseDown = useCallback(
      (opt: any) => {
        const fc = fabricRef.current;
        if (!fc) return;

        // Only create text on empty area
        if (opt.target) return;

        const pointer = fc.getScenePoint(opt.e);
        const text = new Textbox("텍스트 입력", {
          left: pointer.x,
          top: pointer.y,
          width: 200,
          fontSize: textConfig.fontSize,
          fontFamily: textConfig.fontFamily,
          fill: textConfig.color,
          fontWeight: textConfig.bold ? "bold" : "normal",
          fontStyle: textConfig.italic ? "italic" : "normal",
          editable: true,
          selectable: true,
          evented: true,
        });

        fc.add(text);
        fc.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        fc.requestRenderAll();
        saveHistory();

        // Switch back to select after placing text
        setToolMode("select");
      },
      [textConfig, saveHistory],
    );

    const setupTextMode = useCallback(
      (fc: Canvas) => {
        fc.selection = false;
        fc.defaultCursor = "text";
        fc.hoverCursor = "text";

        fc.forEachObject((o) => {
          o.selectable = false;
          o.evented = false;
        });

        fc.on("mouse:down", handleTextMouseDown as any);
      },
      [handleTextMouseDown],
    );

    // ─── Floating toolbar actions ─────────────────────────────────────

    const handleColorChange = useCallback((color: string) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;

      if (obj.type === "path" || obj.type === "line" || obj.type === "polyline") {
        obj.set({ stroke: color });
      } else {
        obj.set({ fill: color });
      }
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    const handleDuplicate = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;

      obj.clone().then((cloned: FabricObject) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        fc.add(cloned);
        fc.setActiveObject(cloned);
        fc.requestRenderAll();
        saveHistory();
      });
    }, [saveHistory]);

    const handleDelete = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const objs = fc.getActiveObjects();
      objs.forEach((o) => fc.remove(o));
      fc.discardActiveObject();
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    const handleLock = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      const locked = !obj.lockMovementX;
      obj.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        hasControls: !locked,
      });
      fc.requestRenderAll();
    }, []);

    const handleBringForward = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      fc.bringObjectForward(obj);
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    const handleSendBackward = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      fc.sendObjectBackwards(obj);
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    const handleBringToFront = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      fc.bringObjectToFront(obj);
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    const handleSendToBack = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      fc.sendObjectToBack(obj);
      fc.requestRenderAll();
      saveHistory();
    }, [saveHistory]);

    // ─── Imperative handle ────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,
      exportImage: (format = "png") => {
        const fc = fabricRef.current;
        if (!fc) return null;
        return fc.toDataURL({ format: format as any, multiplier: 2 });
      },
      toJSON: () => {
        const fc = fabricRef.current;
        if (!fc) return null;
        return fc.toJSON();
      },
      loadJSON: (json: any) => {
        const fc = fabricRef.current;
        if (!fc) return;
        skipSaveRef.current = true;
        fc.loadFromJSON(json).then(() => {
          fc.requestRenderAll();
          historyRef.current = [JSON.stringify(json)];
          futureRef.current = [];
        });
      },
      clear: () => {
        const fc = fabricRef.current;
        if (!fc) return;
        saveHistory();
        fc.clear();
        fc.backgroundColor = "#ffffff";
        fc.requestRenderAll();
      },
      undo: () => {
        const fc = fabricRef.current;
        if (!fc || historyRef.current.length <= 1) return;

        const current = historyRef.current.pop()!;
        futureRef.current.push(current);

        const prev = historyRef.current[historyRef.current.length - 1];
        skipSaveRef.current = true;
        fc.loadFromJSON(JSON.parse(prev)).then(() => {
          fc.requestRenderAll();
        });
      },
      redo: () => {
        const fc = fabricRef.current;
        if (!fc || futureRef.current.length === 0) return;

        const next = futureRef.current.pop()!;
        historyRef.current.push(next);
        skipSaveRef.current = true;
        fc.loadFromJSON(JSON.parse(next)).then(() => {
          fc.requestRenderAll();
        });
      },
    }), [saveHistory]);

    // ─── Render ───────────────────────────────────────────────────────

    return (
      <div
        ref={wrapperRef}
        className={`canva-editor ${className || ""}`}
      >
        {/* Left Toolbar */}
        <CanvaToolbar
          toolMode={toolMode}
          onToolModeChange={setToolMode}
          drawConfig={drawConfig}
          onDrawConfigChange={setDrawConfig}
          lineConfig={lineConfig}
          onLineConfigChange={setLineConfig}
          textConfig={textConfig}
          onTextConfigChange={setTextConfig}
        />

        {/* Canvas Area */}
        <div className="canva-editor__canvas-wrap">
          <canvas ref={canvasElRef} data-testid="canva-editor-canvas" />

          {/* Floating Toolbar */}
          {floatingPos.visible && selectedObj && toolMode === "select" && (
            <CanvaFloatingToolbar
              x={floatingPos.x}
              y={floatingPos.y}
              selectedObj={selectedObj}
              onColorChange={handleColorChange}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onLock={handleLock}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
            />
          )}
        </div>
      </div>
    );
  },
);

CanvaEditor.displayName = "CanvaEditor";

export default CanvaEditor;
