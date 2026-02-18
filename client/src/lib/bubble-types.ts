export type BubbleStyle = "handwritten" | "linedrawing" | "wobbly" | "thought" | "shout" | "rectangle" | "rounded" | "doubleline" | "wavy" | "image";
export type TailStyle = "none" | "long" | "short" | "dots_handwritten" | "dots_linedrawing";

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
    tailCtrl1X?: number;
    tailCtrl1Y?: number;
    tailCtrl2X?: number;
    tailCtrl2Y?: number;
    dotsScale?: number;
    dotsSpacing?: number;
    strokeWidth: number;
    wobble: number;
    fontSize: number;
    fontKey: string;
    templateSrc?: string;
    templateImg?: HTMLImageElement;
    zIndex?: number;
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
