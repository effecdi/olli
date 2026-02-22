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
    | "sticker"
    | "polygon"
    | "spiky"
    | "dashed"
    | "brush"
    | "drip"
    | "sparkle_ring"
    | "flash_eyelash"
    | "embarrassed"
    | "monologue"
    | "tall_rough";
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
    tailRoundness?: number;  // oval/ellipse at tail tip (0=sharp, >0=round oval)
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

export type EffectLayerType =
    | "flash_lines"   // 파열 효과선
    | "flash_dense"   // 집중선
    | "flash_small"   // 작은 파열
    | "firework"      // 불꽃놀이 / 짜잔!     // 몽글몽글 생각 효과
    | "speed_lines"   // 두둥 등장선
    | "anger"         // 화를 내는 효과
    | "surprise"      // 놀라는 효과
    | "collapse"      // 무너지는 효과
    | "star"          // 별
    | "sparkle"       // 빛나는 효과
    | "arrow_up"      // 화살표 위
    | "arrow_down"    // 화살표 아래
    | "exclamation"   // 느낌표
    | "question"      // 물음표
    | "sunburst"      // 집중선 (썬버스트)
    | "scribble"      // 엉킨 실타래 (낙서)
    | "x_mark"        // X 표시
    | "speech_cloud"; // 말풍선 (구름형)

export interface EffectLayer {
    id: string;
    type: EffectLayerType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
    locked?: boolean;
    // visual params
    color?: string;
    strokeColor?: string;
    seed?: number;
}
