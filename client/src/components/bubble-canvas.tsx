import { useRef, useEffect, useCallback, useState } from "react";
import { SpeechBubble, CharacterOverlay, DragMode, PageData } from "@/lib/bubble-types";
import { drawBubble, getTailGeometry, FONT_CSS } from "@/lib/bubble-utils";

interface BubbleCanvasProps {
    page: PageData;
    isActive: boolean;
    zoom: number;
    onUpdateBubble: (id: string, updates: Partial<SpeechBubble>) => void;
    onUpdateChar: (id: string, updates: Partial<CharacterOverlay>) => void;
    onSelectBubble: (id: string | null) => void;
    onSelectChar: (id: string | null) => void;
    selectedBubbleId: string | null;
    selectedCharId: string | null;
    onCanvasRef?: (el: HTMLCanvasElement | null) => void;
    onEditBubble?: (id: string) => void;
    showWatermark?: boolean;
}

export function BubbleCanvas({
    page,
    isActive,
    zoom,
    onUpdateBubble,
    onUpdateChar,
    onSelectBubble,
    onSelectChar,
    selectedBubbleId,
    selectedCharId,
    onCanvasRef,
    onEditBubble,
    showWatermark = false,
}: BubbleCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragModeRef = useRef<DragMode>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const dragBubbleStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const selectedIdRef = useRef<string | null>(selectedBubbleId);
    const selectedCharIdRef = useRef<string | null>(selectedCharId);
    const [fontsInjected, setFontsInjected] = useState(false);

    useEffect(() => {
        selectedIdRef.current = selectedBubbleId;
    }, [selectedBubbleId]);

    useEffect(() => {
        selectedCharIdRef.current = selectedCharId;
    }, [selectedCharId]);

    useEffect(() => {
        if (onCanvasRef) {
            onCanvasRef(canvasRef.current);
        }
    }, [onCanvasRef]);

    useEffect(() => {
        if (!fontsInjected) {
            const style = document.createElement("style");
            style.textContent = FONT_CSS;
            document.head.appendChild(style);
            setFontsInjected(true);
        }
    }, [fontsInjected]);

    const getCanvasPos = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }, []);

    const getHandleAtPos = useCallback((x: number, y: number, b: SpeechBubble): DragMode => {
        const hs = 10; // Handle size in canvas pixels

        if (b.tailStyle !== "none") {
            const geo = getTailGeometry(b);
            if (Math.abs(x - geo.tipX) < hs && Math.abs(y - geo.tipY) < hs) {
                return "move-tail";
            }
        }

        const handles: { mode: DragMode; hx: number; hy: number }[] = [
            { mode: "resize-tl", hx: b.x - 4, hy: b.y - 4 },
            { mode: "resize-t", hx: b.x + b.width / 2, hy: b.y - 4 },
            { mode: "resize-tr", hx: b.x + b.width + 4, hy: b.y - 4 },
            { mode: "resize-r", hx: b.x + b.width + 4, hy: b.y + b.height / 2 },
            { mode: "resize-br", hx: b.x + b.width + 4, hy: b.y + b.height + 4 },
            { mode: "resize-b", hx: b.x + b.width / 2, hy: b.y + b.height + 4 },
            { mode: "resize-bl", hx: b.x - 4, hy: b.y + b.height + 4 },
            { mode: "resize-l", hx: b.x - 4, hy: b.y + b.height / 2 },
        ];

        for (const h of handles) {
            if (Math.abs(x - h.hx) < hs && Math.abs(y - h.hy) < hs) {
                return h.mode;
            }
        }
        return null;
    }, []);

    const getCharHandleAtPos = useCallback((x: number, y: number, c: CharacterOverlay): DragMode => {
        const hs = 12;
        const corners: { mode: DragMode; cx: number; cy: number }[] = [
            { mode: "char-resize-tl", cx: c.x, cy: c.y },
            { mode: "char-resize-tr", cx: c.x + c.width, cy: c.y },
            { mode: "char-resize-bl", cx: c.x, cy: c.y + c.height },
            { mode: "char-resize-br", cx: c.x + c.width, cy: c.y + c.height },
        ];
        for (const h of corners) {
            if (Math.abs(x - h.cx) < hs && Math.abs(y - h.cy) < hs) return h.mode;
        }
        const rx = c.x + c.width / 2;
        const ry = c.y - 16;
        if (Math.hypot(x - rx, y - ry) <= 10) return "char-rotate";
        return null;
    }, []);

    const drawCharOverlaySelection = useCallback((ctx: CanvasRenderingContext2D, c: CharacterOverlay) => {
        ctx.save();
        ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
        ctx.rotate(c.rotation || 0);
        const bx = -c.width / 2 - 2;
        const by = -c.height / 2 - 2;
        const bw = c.width + 4;
        const bh = c.height + 4;
        ctx.strokeStyle = "hsl(150, 80%, 40%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.setLineDash([]);
        const hs = 8;
        const corners = [
            { x: bx, y: by },
            { x: bx + bw, y: by },
            { x: bx, y: by + bh },
            { x: bx + bw, y: by + bh },
        ];
        corners.forEach((pt) => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(pt.x - hs / 2, pt.y - hs / 2, hs, hs);
            ctx.strokeStyle = "hsl(150, 80%, 40%)";
            ctx.lineWidth = 2;
            ctx.strokeRect(pt.x - hs / 2, pt.y - hs / 2, hs, hs);
        });
        ctx.beginPath();
        ctx.arc(0, by - 18, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "hsl(150, 80%, 40%)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }, []);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (page.imageElement) {
            ctx.drawImage(page.imageElement, 0, 0, canvas.width, canvas.height);
        } else if (page.imageDataUrl) {
            const img = new Image();
            img.src = page.imageDataUrl;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const drawables: Array<
            | { type: "char"; z: number; c: CharacterOverlay }
            | { type: "bubble"; z: number; b: SpeechBubble }
        > = [
                ...page.characters.map((c) => ({
                    type: "char" as const,
                    z: c.zIndex ?? 0,
                    c,
                })),
                ...page.bubbles.map((b) => ({
                    type: "bubble" as const,
                    z: b.zIndex ?? 10,
                    b,
                })),
            ];
        drawables.sort((a, b) => a.z - b.z);

        drawables.forEach((d) => {
            if (d.type === "char") {
                const c = d.c;
                if (c.imgElement) {
                    ctx.save();
                    ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
                    ctx.rotate(c.rotation || 0);
                    ctx.drawImage(c.imgElement, -c.width / 2, -c.height / 2, c.width, c.height);
                    ctx.restore();
                }
                if (isActive && c.id === selectedCharId) {
                    drawCharOverlaySelection(ctx, c);
                }
            } else {
                const b = d.b;
                drawBubble(ctx, b, isActive && b.id === selectedBubbleId);
            }
        });

        if (showWatermark) {
            ctx.save();
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText("OLLI Free", canvas.width - 8, canvas.height - 8);
            ctx.restore();
        }

    }, [page, isActive, selectedBubbleId, selectedCharId, drawCharOverlaySelection, showWatermark]);

    useEffect(() => {
        redraw();
    }, [redraw]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isActive) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);

        const pos = getCanvasPos(e.clientX, e.clientY);
        const currentBubbles = page.bubbles;
        const currentSelected = selectedIdRef.current;
        const currentChars = page.characters;
        const currentCharSel = selectedCharIdRef.current;

        if (currentSelected) {
            const selBubble = currentBubbles.find((b) => b.id === currentSelected);
            if (selBubble && !selBubble.locked) {
                const handle = getHandleAtPos(pos.x, pos.y, selBubble);
                if (handle) {
                    dragModeRef.current = handle;
                    dragStartRef.current = pos;
                    dragBubbleStartRef.current = { x: selBubble.x, y: selBubble.y, w: selBubble.width, h: selBubble.height };
                    return;
                }
            }
        }

        if (currentCharSel) {
            const selChar = currentChars.find((c) => c.id === currentCharSel);
            if (selChar && !selChar.locked) {
                const charHandle = getCharHandleAtPos(pos.x, pos.y, selChar);
                if (charHandle) {
                    dragModeRef.current = charHandle;
                    dragStartRef.current = pos;
                    dragBubbleStartRef.current = { x: selChar.x, y: selChar.y, w: selChar.width, h: selChar.height };
                    return;
                }
            }
        }

        const drawables: Array<
            | { type: "char"; z: number; c: CharacterOverlay }
            | { type: "bubble"; z: number; b: SpeechBubble }
        > = [
                ...currentChars.map((c) => ({ type: "char" as const, z: c.zIndex ?? 0, c })),
                ...currentBubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
            ];
        drawables.sort((a, b) => a.z - b.z);

        for (let i = drawables.length - 1; i >= 0; i--) {
            const d = drawables[i];
            if (d.type === "bubble") {
                const b = d.b;
                if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
                    onSelectBubble(b.id);
                    onSelectChar(null);
                    dragModeRef.current = "move";
                    dragStartRef.current = pos;
                    dragBubbleStartRef.current = { x: b.x, y: b.y, w: b.width, h: b.height };
                    return;
                }
            } else {
                const c = d.c;
                if (pos.x >= c.x && pos.x <= c.x + c.width && pos.y >= c.y && pos.y <= c.y + c.height) {
                    onSelectChar(c.id);
                    onSelectBubble(null);
                    dragModeRef.current = "char-move";
                    dragStartRef.current = pos;
                    dragBubbleStartRef.current = { x: c.x, y: c.y, w: c.width, h: c.height };
                    return;
                }
            }
        }

        onSelectBubble(null);
        onSelectChar(null);

    }, [isActive, getCanvasPos, page, getHandleAtPos, getCharHandleAtPos, onSelectBubble, onSelectChar]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isActive) return;
        const pos = getCanvasPos(e.clientX, e.clientY);
        const mode = dragModeRef.current;

        // Cursor update
        if (!mode) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const sid = selectedIdRef.current;
            const charSid = selectedCharIdRef.current;

            if (sid) {
                const selBubble = page.bubbles.find((b) => b.id === sid);
                if (selBubble) {
                    const handle = getHandleAtPos(pos.x, pos.y, selBubble);
                    if (handle) {
                        const cursorMap: Record<string, string> = {
                            "resize-tl": "nw-resize", "resize-tr": "ne-resize",
                            "resize-bl": "sw-resize", "resize-br": "se-resize",
                            "resize-t": "n-resize", "resize-b": "s-resize",
                            "resize-l": "w-resize", "resize-r": "e-resize",
                            "move-tail": "crosshair",
                        };
                        canvas.style.cursor = cursorMap[handle] || "default";
                        return;
                    }
                }
            }
            if (charSid) {
                const selChar = page.characters.find(c => c.id === charSid);
                if (selChar) {
                    const handle = getCharHandleAtPos(pos.x, pos.y, selChar);
                    if (handle) {
                        const cursorMap: Record<string, string> = {
                            "char-resize-tl": "nw-resize", "char-resize-tr": "ne-resize",
                            "char-resize-bl": "sw-resize", "char-resize-br": "se-resize",
                        };
                        canvas.style.cursor = cursorMap[handle] || "default";
                        return;
                    }
                }
            }

            // Hover check
            const drawables: Array<
                | { type: "char"; z: number; c: CharacterOverlay }
                | { type: "bubble"; z: number; b: SpeechBubble }
            > = [
                    ...page.characters.map((c) => ({ type: "char" as const, z: c.zIndex ?? 0, c })),
                    ...page.bubbles.map((b) => ({ type: "bubble" as const, z: b.zIndex ?? 10, b })),
                ];
            drawables.sort((a, b) => a.z - b.z);
            let over = false;
            for (let i = drawables.length - 1; i >= 0; i--) {
                const d = drawables[i];
                if (d.type === "bubble") {
                    if (pos.x >= d.b.x && pos.x <= d.b.x + d.b.width && pos.y >= d.b.y && pos.y <= d.b.y + d.b.height) {
                        canvas.style.cursor = "move";
                        over = true;
                        break;
                    }
                } else {
                    if (pos.x >= d.c.x && pos.x <= d.c.x + d.c.width && pos.y >= d.c.y && pos.y <= d.c.y + d.c.height) {
                        canvas.style.cursor = "move";
                        over = true;
                        break;
                    }
                }
            }
            if (!over) canvas.style.cursor = "default";
            return;
        }

        const dx = pos.x - dragStartRef.current.x;
        const dy = pos.y - dragStartRef.current.y;
        const bs = dragBubbleStartRef.current;
        const minSize = 20;
        const charMinSize = 20;

        const sid = selectedIdRef.current;
        const charSid = selectedCharIdRef.current;

        if (mode === "char-move" && charSid) {
            onUpdateChar(charSid, { x: bs.x + dx, y: bs.y + dy });
            return;
        } else if (mode === "char-rotate" && charSid) {
            const c = page.characters.find((ch) => ch.id === charSid);
            if (c) {
                const cx = c.x + c.width / 2;
                const cy = c.y + c.height / 2;
                const startAngle = Math.atan2(dragStartRef.current.y - cy, dragStartRef.current.x - cx);
                const currentAngle = Math.atan2(pos.y - cy, pos.x - cx);
                const delta = currentAngle - startAngle;
                onUpdateChar(charSid, { rotation: (c.rotation || 0) + delta });
            }
            return;
        } else if (mode.startsWith("char-resize") && charSid) {
            const aspect = bs.w / bs.h;
            if (mode === "char-resize-br") {
                const newW = Math.max(charMinSize, bs.w + dx);
                onUpdateChar(charSid, { width: newW, height: newW / aspect });
            } else if (mode === "char-resize-bl") {
                const newW = Math.max(charMinSize, bs.w - dx);
                onUpdateChar(charSid, { x: bs.x + bs.w - newW, width: newW, height: newW / aspect });
            } else if (mode === "char-resize-tr") {
                const newW = Math.max(charMinSize, bs.w + dx);
                onUpdateChar(charSid, { y: bs.y + bs.h - newW / aspect, width: newW, height: newW / aspect });
            } else if (mode === "char-resize-tl") {
                const newW = Math.max(charMinSize, bs.w - dx);
                const newH = newW / aspect;
                onUpdateChar(charSid, { x: bs.x + bs.w - newW, y: bs.y + bs.h - newH, width: newW, height: newH });
            }
            return;
        }

        if (mode === "move-tail" && sid) {
            onUpdateBubble(sid, { tailTipX: pos.x, tailTipY: pos.y });
        } else if (mode === "move" && sid) {
            onUpdateBubble(sid, { x: bs.x + dx, y: bs.y + dy });
        } else if (mode === "resize-br" && sid) {
            onUpdateBubble(sid, { width: Math.max(minSize, bs.w + dx), height: Math.max(minSize, bs.h + dy) });
        } else if (mode === "resize-bl" && sid) {
            const newW = Math.max(minSize, bs.w - dx);
            onUpdateBubble(sid, { x: bs.x + bs.w - newW, width: newW, height: Math.max(minSize, bs.h + dy) });
        } else if (mode === "resize-tr" && sid) {
            const newH = Math.max(minSize, bs.h - dy);
            onUpdateBubble(sid, { y: bs.y + bs.h - newH, width: Math.max(minSize, bs.w + dx), height: newH });
        } else if (mode === "resize-tl" && sid) {
            const newW = Math.max(minSize, bs.w - dx);
            const newH = Math.max(minSize, bs.h - dy);
            onUpdateBubble(sid, { x: bs.x + bs.w - newW, y: bs.y + bs.h - newH, width: newW, height: newH });
        } else if (mode === "resize-r" && sid) {
            onUpdateBubble(sid, { width: Math.max(minSize, bs.w + dx) });
        } else if (mode === "resize-l" && sid) {
            const newW = Math.max(minSize, bs.w - dx);
            onUpdateBubble(sid, { x: bs.x + bs.w - newW, width: newW });
        } else if (mode === "resize-b" && sid) {
            onUpdateBubble(sid, { height: Math.max(minSize, bs.h + dy) });
        } else if (mode === "resize-t" && sid) {
            const newH = Math.max(minSize, bs.h - dy);
            onUpdateBubble(sid, { y: bs.y + bs.h - newH, height: newH });
        }

    }, [isActive, getCanvasPos, page, onUpdateBubble, onUpdateChar, getHandleAtPos, getCharHandleAtPos]);

    const handlePointerUp = useCallback(() => {
        dragModeRef.current = null;
    }, []);

    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isActive || !onEditBubble) return;
        const pos = getCanvasPos(e.clientX, e.clientY);
        for (let i = page.bubbles.length - 1; i >= 0; i--) {
            const b = page.bubbles[i];
            if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
                onEditBubble(b.id);
                return;
            }
        }
    }, [isActive, getCanvasPos, page, onEditBubble]);

    return (
        <canvas
            ref={canvasRef}
            width={page.canvasSize.width}
            height={page.canvasSize.height}
            className={`touch-none ${isActive ? "shadow-sm" : "opacity-80"}`}
            style={{
                width: page.canvasSize.width,
                height: page.canvasSize.height,
                maxWidth: "100%",
                cursor: isActive ? "default" : "pointer",
                border: isActive ? "1px solid rgba(0,0,0,0.1)" : "1px solid transparent"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
        />
    );
}
