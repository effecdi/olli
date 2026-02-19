export type BubbleStyle =
    | "handwritten"
    | "linedrawing"
    | "wobbly"
    | "thought"
    | "shout"
    | "rectangle"
    | "rounded"
    | "doubleline"
    | "wavy"
    | "image"
    | "flash_black"
    | "flash_dense"
    | "cloud"
    | "electric"
    | "sticker"
    | "polygon"
    | "spiky"
    | "dashed"
    | "brush"
    | "drip"
    | "sparkle_ring"
    | "flash_eyelash";
export type TailStyle = "none" | "long" | "short" | "dots_handwritten" | "dots_linedrawing";

export type TailDrawMode = "bezier" | "straight" | "polyline" | "spline";

export interface SpeechBubble {
    id: string;
    seed: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    style: BubbleStyle;
    tailStyle: TailStyle;
    tailDirection: "bottom" | "left" | "right" | "top";
    tailTipX?: number;
    tailTipY?: number;
    tailBaseSpread?: number;
    tailLength?: number;
    tailCurve?: number;
    tailJitter?: number;
    tailTipSpread?: number;  // bluntness at tail tip (0=sharp, >0=wide/blunt)
    tailCtrl1X?: number;
    tailCtrl1Y?: number;
    tailCtrl2X?: number;
    tailCtrl2Y?: number;
    dotsScale?: number;
    dotsSpacing?: number;
    tailDrawMode?: TailDrawMode;
    tailPoints?: { x: number; y: number }[];
    drawMode?: "both" | "fill_only" | "stroke_only";
    fillColor?: string;
    strokeColor?: string;
    fillOpacity?: number;
    flashLineCount?: number;
    flashLineLength?: number;
    flashLineSpacing?: number;
    flashLineThickness?: number;
    flashBumpCount?: number;
    flashBumpHeight?: number;
    flashInnerRadius?: number;
    flashFilled?: boolean;
    shapeSides?: number;
    shapeCornerRadius?: number;
    shapeWobble?: number;
    shapeSpikeCount?: number;
    shapeSpikeHeight?: number;
    shapeSpikeSharpness?: number;
    shapeBumpCount?: number;
    shapeBumpSize?: number;
    shapeBumpRoundness?: number;
    strokeWidth: number;
    wobble: number;
    fontSize: number;
    fontKey: string;
    templateSrc?: string;
    templateImg?: HTMLImageElement;
    zIndex?: number;
    groupId?: string;
    locked?: boolean;
}

export interface CharacterOverlay {
    id: string;
    imageUrl: string;
    imgElement: HTMLImageElement | null;
    x: number;
    y: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    label: string;
    rotation?: number;
    zIndex?: number;
    locked?: boolean;
}

export type DragMode = null | "move" | "move-tail" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "resize-r" | "resize-l" | "resize-t" | "resize-b"
    | "char-move" | "char-resize-br" | "char-resize-bl" | "char-resize-tr" | "char-resize-tl" | "char-rotate"
    | "tail-ctrl1" | "tail-ctrl2";

export interface PageData {
    id: string;
    bubbles: SpeechBubble[];
    characters: CharacterOverlay[];
    imageDataUrl?: string; // For background image source
    imageElement?: HTMLImageElement | null; // For runtime rendering
    canvasSize: { width: number; height: number };
    backgroundColor?: string;
    name?: string; // Page name?
}
