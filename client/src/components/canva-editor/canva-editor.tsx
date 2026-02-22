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
import CanvaFloatingToolbar from "./canva-floating-toolbar";
import type {
  FloatingToolbarPos,
  CanvaEditorHandle,
  CanvaEditorProps,
} from "./types";
import "./canva-editor.scss";

const MAX_HISTORY = 40;

const CanvaEditor = forwardRef<CanvaEditorHandle, CanvaEditorProps>(
  (
    {
      width,
      height,
      className,
      backgroundImage,
      toolMode,
      drawConfig,
      lineConfig,
      textConfig,
      onToolModeChange,
      onObjectSelected,
    },
    ref,
  ) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    // Curve drawing refs (3-click bezier: start -> end -> control point)
    const curveStepRef = useRef<0 | 1 | 2>(0); // 0=waiting start, 1=waiting end, 2=waiting control
    const curveStartRef = useRef<Point | null>(null);
    const curveEndRef = useRef<Point | null>(null);
    const tempCurveRef = useRef<Path | null>(null);

    // Track ALL event handlers registered by tool modes for reliable cleanup
    const toolHandlersRef = useRef<
      Array<{ event: string; handler: (...args: any[]) => void }>
    >([]);

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

      historyRef.current = [JSON.stringify(fc.toJSON())];

      // Selection events
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
      fc.on("object:modified", () => saveHistory());
      fc.on("path:created", () => saveHistory());

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

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.setDimensions({ width, height });
      fc.requestRenderAll();
    }, [width, height]);

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc || !backgroundImage) return;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        fc.backgroundImage = undefined;
        fc.requestRenderAll();
      };
      img.src = backgroundImage;
    }, [backgroundImage]);

    // ─── Tool mode switching (reacts to prop changes) ─────────────────

    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;

      // ── 1. Complete cleanup of ALL previous tool handlers ──
      for (const { event, handler } of toolHandlersRef.current) {
        fc.off(event as any, handler as any);
      }
      toolHandlersRef.current = [];

      // ── 2. Reset canvas state ──
      fc.isDrawingMode = false;
      fc.selection = true;
      fc.defaultCursor = "default";
      fc.hoverCursor = "move";

      // Finalize any in-progress polyline before clearing
      if (tempPolyRef.current && polyPointsRef.current.length >= 2) {
        tempPolyRef.current.set({ selectable: true, evented: true });
        fc.requestRenderAll();
        saveHistory();
      }
      tempPolyRef.current = null;
      polyPointsRef.current = [];

      // Clean up temp straight line
      if (tempLineRef.current) {
        fc.remove(tempLineRef.current);
        tempLineRef.current = null;
      }
      lineStartRef.current = null;

      // Clean up temp curve
      if (tempCurveRef.current) {
        fc.remove(tempCurveRef.current);
        tempCurveRef.current = null;
      }
      curveStepRef.current = 0;
      curveStartRef.current = null;
      curveEndRef.current = null;

      // Restore all objects to selectable
      fc.forEachObject((o) => {
        o.selectable = true;
        o.evented = true;
      });

      // ── 3. Helper: register handler with tracking ──
      const on = (event: string, handler: (...args: any[]) => void) => {
        toolHandlersRef.current.push({ event, handler });
        fc.on(event as any, handler as any);
      };

      // ── 4. Set up new tool mode ──
      switch (toolMode) {
        case "draw": {
          fc.isDrawingMode = true;
          fc.selection = false;
          const brush = new PencilBrush(fc);
          brush.color = drawConfig.color;
          brush.width =
            drawConfig.subTool === "marker"
              ? drawConfig.size * 2.5
              : drawConfig.subTool === "highlighter"
                ? drawConfig.size * 4
                : drawConfig.size;
          fc.freeDrawingBrush = brush;

          on("path:created", (e: any) => {
            const path = e.path as Path;
            if (!path) return;
            let op = drawConfig.opacity;
            if (drawConfig.subTool === "highlighter") op *= 0.4;
            path.set({ opacity: op });
            fc.requestRenderAll();
          });
          break;
        }

        case "eraser": {
          fc.selection = false;
          fc.defaultCursor = "crosshair";
          fc.hoverCursor = "crosshair";
          on("mouse:down", (opt: any) => {
            if (opt.target) {
              fc.remove(opt.target);
              fc.requestRenderAll();
              saveHistory();
            }
          });
          break;
        }

        case "line": {
          fc.selection = false;
          fc.defaultCursor = "crosshair";
          fc.hoverCursor = "crosshair";
          fc.forEachObject((o) => {
            o.selectable = false;
            o.evented = false;
          });

          if (lineConfig.subTool === "curve") {
            // ── Curve: 3-click quadratic bezier (start → end → control point) ──
            curveStepRef.current = 0;

            on("mouse:down", (opt: any) => {
              const pointer = fc.getScenePoint(opt.e);
              const step = curveStepRef.current;

              if (step === 0) {
                // 1st click: set start point
                curveStartRef.current = new Point(pointer.x, pointer.y);
                curveStepRef.current = 1;
              } else if (step === 1) {
                // 2nd click: set end point, show straight line preview
                curveEndRef.current = new Point(pointer.x, pointer.y);
                const s = curveStartRef.current!;
                const e = curveEndRef.current;
                const midX = (s.x + e.x) / 2;
                const midY = (s.y + e.y) / 2;
                const pathStr = `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}`;
                if (tempCurveRef.current) fc.remove(tempCurveRef.current);
                const p = new Path(pathStr, {
                  fill: "transparent",
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity,
                  selectable: false,
                  evented: false,
                  objectCaching: false,
                });
                tempCurveRef.current = p;
                fc.add(p);
                fc.requestRenderAll();
                curveStepRef.current = 2;
              } else {
                // 3rd click: finalize curve at current control point
                if (tempCurveRef.current) {
                  tempCurveRef.current.set({ selectable: true, evented: true, objectCaching: true });
                  fc.requestRenderAll();
                  saveHistory();
                }
                tempCurveRef.current = null;
                curveStartRef.current = null;
                curveEndRef.current = null;
                curveStepRef.current = 0;
              }
            });

            on("mouse:move", (opt: any) => {
              const step = curveStepRef.current;
              if (step === 1 && curveStartRef.current) {
                // Preview straight line from start to cursor
                const pointer = fc.getScenePoint(opt.e);
                const s = curveStartRef.current;
                const pathStr = `M ${s.x} ${s.y} L ${pointer.x} ${pointer.y}`;
                if (tempCurveRef.current) fc.remove(tempCurveRef.current);
                const p = new Path(pathStr, {
                  fill: "transparent",
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity * 0.5,
                  selectable: false,
                  evented: false,
                  objectCaching: false,
                  strokeDashArray: [6, 4],
                });
                tempCurveRef.current = p;
                fc.add(p);
                fc.requestRenderAll();
              } else if (step === 2 && curveStartRef.current && curveEndRef.current) {
                // Bend curve: mouse position = control point
                const pointer = fc.getScenePoint(opt.e);
                const s = curveStartRef.current;
                const e = curveEndRef.current;
                const pathStr = `M ${s.x} ${s.y} Q ${pointer.x} ${pointer.y} ${e.x} ${e.y}`;
                if (tempCurveRef.current) fc.remove(tempCurveRef.current);
                const p = new Path(pathStr, {
                  fill: "transparent",
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity,
                  selectable: false,
                  evented: false,
                  objectCaching: false,
                });
                tempCurveRef.current = p;
                fc.add(p);
                fc.requestRenderAll();
              }
            });
          } else if (lineConfig.subTool === "polyline") {
            // ── Polyline: click to add points, dblclick to finish ──
            on("mouse:down", (opt: any) => {
              const pointer = fc.getScenePoint(opt.e);
              polyPointsRef.current.push(new Point(pointer.x, pointer.y));
              if (tempPolyRef.current) fc.remove(tempPolyRef.current);
              const pl = new Polyline(
                polyPointsRef.current.map((p) => ({ x: p.x, y: p.y })),
                {
                  fill: "transparent",
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity,
                  selectable: false,
                  evented: false,
                  objectCaching: false,
                },
              );
              tempPolyRef.current = pl;
              fc.add(pl);
              fc.requestRenderAll();
            });

            on("mouse:dblclick", () => {
              if (
                polyPointsRef.current.length >= 2 &&
                tempPolyRef.current
              ) {
                tempPolyRef.current.set({
                  selectable: true,
                  evented: true,
                });
                fc.requestRenderAll();
                saveHistory();
              }
              polyPointsRef.current = [];
              tempPolyRef.current = null;
            });
          } else {
            // ── Straight line: drag to draw ──
            on("mouse:down", (opt: any) => {
              const pointer = fc.getScenePoint(opt.e);
              lineStartRef.current = new Point(pointer.x, pointer.y);
              const l = new Line(
                [pointer.x, pointer.y, pointer.x, pointer.y],
                {
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity,
                  selectable: false,
                  evented: false,
                },
              );
              tempLineRef.current = l;
              fc.add(l);
            });

            on("mouse:move", (opt: any) => {
              if (!lineStartRef.current || !tempLineRef.current) return;
              const pointer = fc.getScenePoint(opt.e);
              tempLineRef.current.set({ x2: pointer.x, y2: pointer.y });
              fc.requestRenderAll();
            });

            on("mouse:up", (opt: any) => {
              if (!lineStartRef.current || !tempLineRef.current) return;
              const pointer = fc.getScenePoint(opt.e);
              fc.remove(tempLineRef.current);
              const s = lineStartRef.current;
              fc.add(
                new Line([s.x, s.y, pointer.x, pointer.y], {
                  stroke: lineConfig.color,
                  strokeWidth: lineConfig.size,
                  opacity: lineConfig.opacity,
                  selectable: true,
                  evented: true,
                }),
              );
              lineStartRef.current = null;
              tempLineRef.current = null;
              fc.requestRenderAll();
              saveHistory();
            });
          }
          break;
        }

        case "text": {
          fc.selection = false;
          fc.defaultCursor = "text";
          fc.hoverCursor = "text";
          fc.forEachObject((o) => {
            o.selectable = false;
            o.evented = false;
          });

          on("mouse:down", (opt: any) => {
            if (opt.target) return;
            const pointer = fc.getScenePoint(opt.e);
            const t = new Textbox("텍스트 입력", {
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
            fc.add(t);
            fc.setActiveObject(t);
            t.enterEditing();
            t.selectAll();
            fc.requestRenderAll();
            saveHistory();
            onToolModeChange?.("select");
          });
          break;
        }
      }

      fc.requestRenderAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toolMode, drawConfig, lineConfig, textConfig]);

    // ─── Floating toolbar actions ─────────────────────────────────────

    const handleColorChange = useCallback((color: string) => {
      const fc = fabricRef.current; if (!fc) return;
      const obj = fc.getActiveObject(); if (!obj) return;
      if (obj.type === "path" || obj.type === "line" || obj.type === "polyline") {
        obj.set({ stroke: color });
      } else { obj.set({ fill: color }); }
      fc.requestRenderAll(); saveHistory();
    }, [saveHistory]);

    const handleDuplicate = useCallback(() => {
      const fc = fabricRef.current; if (!fc) return;
      const obj = fc.getActiveObject(); if (!obj) return;
      obj.clone().then((cloned: FabricObject) => {
        cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
        fc.add(cloned); fc.setActiveObject(cloned); fc.requestRenderAll(); saveHistory();
      });
    }, [saveHistory]);

    const handleDelete = useCallback(() => {
      const fc = fabricRef.current; if (!fc) return;
      fc.getActiveObjects().forEach((o) => fc.remove(o));
      fc.discardActiveObject(); fc.requestRenderAll(); saveHistory();
    }, [saveHistory]);

    const handleLock = useCallback(() => {
      const fc = fabricRef.current; if (!fc) return;
      const obj = fc.getActiveObject(); if (!obj) return;
      const locked = !obj.lockMovementX;
      obj.set({ lockMovementX: locked, lockMovementY: locked, lockRotation: locked, lockScalingX: locked, lockScalingY: locked, hasControls: !locked });
      fc.requestRenderAll();
    }, []);

    const handleBringForward = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.bringObjectForward(o); fc.requestRenderAll(); saveHistory(); } }, [saveHistory]);
    const handleSendBackward = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.sendObjectBackwards(o); fc.requestRenderAll(); saveHistory(); } }, [saveHistory]);
    const handleBringToFront = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.bringObjectToFront(o); fc.requestRenderAll(); saveHistory(); } }, [saveHistory]);
    const handleSendToBack = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.sendObjectToBack(o); fc.requestRenderAll(); saveHistory(); } }, [saveHistory]);

    // ─── Imperative handle ────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,
      exportImage: (format = "png") => {
        const fc = fabricRef.current; if (!fc) return null;
        return fc.toDataURL({ format: format as any, multiplier: 2 });
      },
      toJSON: () => { const fc = fabricRef.current; return fc ? fc.toJSON() : null; },
      loadJSON: (json: any) => {
        const fc = fabricRef.current; if (!fc) return;
        skipSaveRef.current = true;
        fc.loadFromJSON(json).then(() => { fc.requestRenderAll(); historyRef.current = [JSON.stringify(json)]; futureRef.current = []; });
      },
      clear: () => {
        const fc = fabricRef.current; if (!fc) return;
        saveHistory(); fc.clear(); fc.backgroundColor = "#ffffff"; fc.requestRenderAll();
      },
      undo: () => {
        const fc = fabricRef.current; if (!fc || historyRef.current.length <= 1) return;
        futureRef.current.push(historyRef.current.pop()!);
        skipSaveRef.current = true;
        fc.loadFromJSON(JSON.parse(historyRef.current[historyRef.current.length - 1])).then(() => fc.requestRenderAll());
      },
      redo: () => {
        const fc = fabricRef.current; if (!fc || futureRef.current.length === 0) return;
        const next = futureRef.current.pop()!;
        historyRef.current.push(next);
        skipSaveRef.current = true;
        fc.loadFromJSON(JSON.parse(next)).then(() => fc.requestRenderAll());
      },
    }), [saveHistory]);

    // ─── Render (canvas only, no internal toolbar) ────────────────────

    return (
      <div ref={wrapperRef} className={`canva-editor ${className || ""}`}>
        <div className="canva-editor__canvas-wrap">
          <canvas ref={canvasElRef} data-testid="canva-editor-canvas" />

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
