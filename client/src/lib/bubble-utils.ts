import { SpeechBubble, BubbleStyle, TailStyle } from "./bubble-types";

export const KOREAN_FONTS = [
    { value: "default", label: "기본 고딕", family: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" },
    { value: "OnglippDaelong", label: "온글잎 대롱", family: "'OnglippDaelong', cursive" },
    { value: "OngleipParkDahyeon", label: "온글잎 박다현", family: "'OngleipParkDahyeon', cursive" },
    { value: "OngleipStudyWell", label: "온글잎 공부열심히", family: "'OngleipStudyWell', cursive" },
    { value: "NostalgicCocochoitoon", label: "코코초이툰", family: "'NostalgicCocochoitoon', cursive" },
    { value: "GeekbleMalrangiche", label: "긱블 말랑이체", family: "'GeekbleMalrangiche', cursive" },
    { value: "Gyeombalbal", label: "인성IT 귀여운지수", family: "'Gyeombalbal', cursive" },
    { value: "IsYun", label: "이서윤체", family: "'IsYun', cursive" },
    { value: "Cafe24Surround", label: "카페24 서라운드", family: "'Cafe24Surround', sans-serif" },
    { value: "GMarketSans", label: "지마켓 산스", family: "'GMarketSans', sans-serif" },
    { value: "Paperozi", label: "페이퍼로지", family: "'Paperozi', sans-serif" },
    { value: "Pretendard", label: "프리텐다드", family: "'Pretendard', sans-serif" },
    { value: "MemomentKkukkukk", label: "미모먼트 꾸꾸꾸", family: "'MemomentKkukkukk', sans-serif" },
];

export const FONT_CSS = `
@font-face { font-family: 'OnglippDaelong'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2507-2@1.0/Ownglyph_daelong-Rg.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'OngleipParkDahyeon'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/Ownglyph_ParkDaHyun.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'OngleipStudyWell'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/Ownglyph_StudyHard-Rg.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'NostalgicCocochoitoon'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-1@1.0/Griun_Cocochoitoon-Rg.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'GeekbleMalrangiche'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302_01@1.0/GeekbleMalang2WOFF2.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gyeombalbal'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/insungitCutelivelyjisu.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'IsYun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202-2@1.0/LeeSeoyun.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cafe24Surround'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Cafe24Ssurround.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
@font-face { font-family: 'GMarketSans'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansLight.woff') format('woff'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'GMarketSans'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'GMarketSans'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-1Thin.woff2') format('woff2'); font-weight: 100; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-2ExtraLight.woff2') format('woff2'); font-weight: 200; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-3Light.woff2') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-5Medium.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-6SemiBold.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-8ExtraBold.woff2') format('woff2'); font-weight: 800; font-style: normal; font-display: swap; }
@font-face { font-family: 'Paperozi'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-9Black.woff2') format('woff2'); font-weight: 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Thin.woff2') format('woff2'); font-weight: 100; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraLight.woff2') format('woff2'); font-weight: 200; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Light.woff2') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Medium.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-SemiBold.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraBold.woff2') format('woff2'); font-weight: 800; font-style: normal; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Black.woff2') format('woff2'); font-weight: 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'MemomentKkukkukk'; src: url('/fonts/MemomentKkukkukk.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
`;

export const STYLE_LABELS: Record<string, string> = {
    linedrawing: "심플 라인",
    handwritten: "손글씨",
    rounded: "둥근 사각형",
    rectangle: "사각형",
    thought: "생각 구름",
    shout: "외침",
    wobbly: "불안한",
    doubleline: "이중선",
    wavy: "물결",
    polygon: "다각형",
    spiky: "뾰족한",
    cloud: "구름",
    electric: "번개",
    sticker: "스티커",
    image: "이미지",
};

export const FLASH_STYLE_LABELS: Record<string, string> = {
    flash_black: "검은 바탕",
    flash_normal: "플래시",
    flash_dense: "빽빽한",
};

export const TAIL_LABELS: Record<TailStyle, string> = {
    none: "없음",
    long: "길게 빼기",
    short: "짧게 빼기",
    dots_handwritten: "점점점 (손글씨)",
    dots_linedrawing: "점점점 (라인)",
};

export function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

export function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export function getFontFamily(fontKey: string): string {
    const font = KOREAN_FONTS.find((f) => f.value === fontKey);
    return font ? font.family : KOREAN_FONTS[0].family;
}

export function getDefaultTailTip(bubble: SpeechBubble) {
    const cx = bubble.x + bubble.width / 2;
    const cy = bubble.y + bubble.height / 2;
    const styleLen = bubble.tailStyle === "long" || bubble.tailStyle === "dots_handwritten" || bubble.tailStyle === "dots_linedrawing" ? 50 : 25;
    const tailLen = bubble.tailLength ?? styleLen;
    switch (bubble.tailDirection) {
        case "bottom": return { x: cx + 10, y: bubble.y + bubble.height + tailLen };
        case "top": return { x: cx + 10, y: bubble.y - tailLen };
        case "left": return { x: bubble.x - tailLen, y: cy + 10 };
        case "right": return { x: bubble.x + bubble.width + tailLen, y: cy + 10 };
    }
}

export function getTailGeometry(bubble: SpeechBubble) {
    const cx = bubble.x + bubble.width / 2;
    const cy = bubble.y + bubble.height / 2;
    const rx = bubble.width / 2;
    const ry = bubble.height / 2;

    const defaultTip = getDefaultTailTip(bubble) || { x: cx + 10, y: bubble.y + bubble.height + 50 };
    const tipX = bubble.tailTipX ?? defaultTip.x;
    const tipY = bubble.tailTipY ?? defaultTip.y;

    const mainAngle = Math.atan2(tipY - cy, tipX - cx);

    const spreadPx = bubble.tailBaseSpread ?? 15;
    const avgR = (rx + ry) / 2;
    const spreadAngle = Math.atan2(spreadPx, avgR);

    const angleA = mainAngle - spreadAngle;
    const angleB = mainAngle + spreadAngle;
    const baseAx = cx + rx * Math.cos(angleA);
    const baseAy = cy + ry * Math.sin(angleA);
    const baseBx = cx + rx * Math.cos(angleB);
    const baseBy = cy + ry * Math.sin(angleB);

    const tailLen = Math.sqrt((tipX - cx) ** 2 + (tipY - cy) ** 2);
    return { tipX, tipY, baseAx, baseAy, baseBx, baseBy, tailLen, angleA, angleB };
}

// Drawing helper functions
function drawHandwrittenPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const segments = 60;
    const rand = seededRandom(seed);

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const jitterX = (rand() - 0.5) * strokeWidth * 1.5;
        const jitterY = (rand() - 0.5) * strokeWidth * 1.5;
        const px = cx + Math.cos(angle) * rx + jitterX;
        const py = cy + Math.sin(angle) * ry + jitterY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawLinedrawingPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
}

function drawWobblyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, wobble: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const segments = 80;

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wobbleX = Math.sin(angle * 6) * wobble;
        const wobbleY = Math.cos(angle * 8) * wobble * 0.7;
        const px = cx + Math.cos(angle) * (rx + wobbleX);
        const py = cy + Math.sin(angle) * (ry + wobbleY);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawPolygonPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeWidth: number,
    seed: number,
    sides: number = 6,
    cornerRadius: number = 8,
    wobble: number = 0,
) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const rx = w / 2, ry = h / 2;
    const cx = x + rx, cy = y + ry;
    const rand = seededRandom(seed + 300);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const jx = wobble > 0 ? (rand() - 0.5) * wobble * 2 : 0;
        const jy = wobble > 0 ? (rand() - 0.5) * wobble * 2 : 0;
        pts.push({
            x: cx + Math.cos(angle) * (rx - strokeWidth) + jx,
            y: cy + Math.sin(angle) * (ry - strokeWidth) + jy,
        });
    }
    ctx.beginPath();
    if (cornerRadius <= 1) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
    } else {
        const cr = Math.min(cornerRadius, 30);
        for (let i = 0; i < pts.length; i++) {
            const prev = pts[(i - 1 + pts.length) % pts.length];
            const curr = pts[i];
            const next = pts[(i + 1) % pts.length];
            const d1x = curr.x - prev.x, d1y = curr.y - prev.y;
            const d2x = next.x - curr.x, d2y = next.y - curr.y;
            const len1 = Math.hypot(d1x, d1y);
            const len2 = Math.hypot(d2x, d2y);
            const r = Math.min(cr, len1 / 2, len2 / 2);
            const p1x = curr.x - (d1x / len1) * r;
            const p1y = curr.y - (d1y / len1) * r;
            const p2x = curr.x + (d2x / len2) * r;
            const p2y = curr.y + (d2y / len2) * r;
            if (i === 0) ctx.moveTo(p1x, p1y);
            else ctx.lineTo(p1x, p1y);
            ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
        }
        ctx.closePath();
    }
}

function drawThoughtPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const bumps = 16;
    const bumpSize = Math.min(rx, ry) * 0.18;
    const rand = seededRandom(seed);

    ctx.beginPath();
    for (let i = 0; i <= bumps * 4; i++) {
        const t = i / (bumps * 4);
        const angle = t * Math.PI * 2;
        const bumpAngle = angle * bumps;
        const bump = Math.abs(Math.cos(bumpAngle)) * bumpSize + (rand() - 0.5) * bumpSize * 0.3;
        const px = cx + Math.cos(angle) * (rx + bump);
        const py = cy + Math.sin(angle) * (ry + bump);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawSpikyPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeWidth: number,
    seed: number,
    spikeCount: number = 12,
    spikeHeight: number = 20,
    sharpness: number = 0.7,
    wobble: number = 0,
) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const rx = w / 2, ry = h / 2;
    const cx = x + rx, cy = y + ry;
    const rand = seededRandom(seed + 400);
    const total = spikeCount * 2;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < total; i++) {
        const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
        const isSpike = i % 2 === 0;
        const baseR = isSpike
            ? 1 + spikeHeight / Math.min(rx, ry)
            : 1 - (spikeHeight * sharpness * 0.4) / Math.min(rx, ry);
        const jitter = wobble > 0 ? (rand() - 0.5) * wobble : 0;
        const r = Math.max(0.3, baseR + jitter / Math.min(rx, ry));
        pts.push({ x: cx + Math.cos(angle) * rx * r, y: cy + Math.sin(angle) * ry * r });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        if (sharpness > 0.5) {
            ctx.lineTo(pts[i].x, pts[i].y);
        } else {
            const p = pts[i - 1], c = pts[i];
            ctx.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2);
        }
    }
    ctx.closePath();
}

function drawCloudPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeWidth: number,
    seed: number,
    bubble: SpeechBubble,
) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const rx = w / 2, ry = h / 2;
    const cx = x + rx, cy = y + ry;
    const bumpCount = bubble.shapeBumpCount ?? 8;
    const bumpSize = bubble.shapeBumpSize ?? 15;
    const roundness = bubble.shapeBumpRoundness ?? 0.8;
    const rand = seededRandom(seed + 200);
    ctx.beginPath();
    for (let i = 0; i <= bumpCount; i++) {
        const angle = (i / bumpCount) * Math.PI * 2 - Math.PI / 2;
        const nextAngle = ((i + 0.5) / bumpCount) * Math.PI * 2 - Math.PI / 2;
        const bx = cx + Math.cos(angle) * rx;
        const by = cy + Math.sin(angle) * ry;
        const jitter = (rand() - 0.5) * bumpSize * 0.3;
        const outward = 1 + (bumpSize + jitter) / Math.min(rx, ry);
        const cpx = cx + Math.cos(nextAngle) * rx * (1 + (bumpSize * roundness) / Math.min(rx, ry));
        const cpy = cy + Math.sin(nextAngle) * ry * (1 + (bumpSize * roundness) / Math.min(rx, ry));
        const nbx = cx + Math.cos(((i + 1) / bumpCount) * Math.PI * 2 - Math.PI / 2) * rx;
        const nby = cy + Math.sin(((i + 1) / bumpCount) * Math.PI * 2 - Math.PI / 2) * ry;
        if (i === 0) ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(cpx, cpy, nbx, nby);
    }
    ctx.closePath();
}

function drawShoutPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number, seed: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "miter";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const spikes = 12;
    const rand = seededRandom(seed);

    ctx.beginPath();
    for (let i = 0; i <= spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const isSpike = i % 2 === 0;
        const spikeLen = isSpike ? 0.25 + rand() * 0.15 : 0;
        const r = isSpike ? 1 + spikeLen : 0.82;
        const px = cx + Math.cos(angle) * rx * r;
        const py = cy + Math.sin(angle) * ry * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawRectanglePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
}

function drawRoundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const r = Math.min(w, h) * 0.2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.closePath();
}

function drawDoublelinePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.stroke();

    const gap = strokeWidth * 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - gap, ry - gap, 0, 0, Math.PI * 2);
    ctx.closePath();
}

function drawWavyPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeWidth: number) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const waves = 10;
    const waveAmp = Math.min(rx, ry) * 0.08;
    const segments = 120;

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wave = Math.sin(angle * waves) * waveAmp;
        const px = cx + Math.cos(angle) * (rx + wave);
        const py = cy + Math.sin(angle) * (ry + wave);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawFlashStyle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    sw: number,
    seed: number,
    style: BubbleStyle,
    opts: {
        lineCount: number;
        lineLength: number;
        lineSpacing: number;
        lineThickness: number;
        bumpCount: number;
        bumpHeight: number;
        innerRadius: number;
        filled: boolean;
    },
) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const rand = seededRandom(seed);
    const { lineCount, lineLength, lineSpacing, lineThickness, bumpCount, bumpHeight, innerRadius, filled } = opts;

    if (style === "flash_black") {
        ctx.beginPath();
        const spikes = bumpCount * 2;
        for (let i = 0; i <= spikes; i++) {
            const angle = (i / spikes) * Math.PI * 2;
            const isOuter = i % 2 === 0;
            const r = isOuter ? 1 + bumpHeight / 100 : 1 - bumpHeight / 200;
            const px = cx + rx * r * Math.cos(angle);
            const py = cy + ry * r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = "#222";
        ctx.fill();
    }

    const actualCount = style === "flash_dense" ? Math.round(lineCount / lineSpacing) : lineCount;

    for (let i = 0; i < actualCount; i++) {
        const angle = (i / actualCount) * Math.PI * 2;
        const lenVariance = lineLength * (0.7 + rand() * 0.6);

        const startR = style === "flash_black" ? 1 : innerRadius;
        const startX = cx + rx * startR * Math.cos(angle);
        const startY = cy + ry * startR * Math.sin(angle);

        const endX = cx + (rx * startR + lenVariance) * Math.cos(angle);
        const endY = cy + (ry * startR + lenVariance) * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = lineThickness;
        ctx.strokeStyle = "#222";
        ctx.lineCap = "round";
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * innerRadius, ry * innerRadius, 0, 0, Math.PI * 2);
    ctx.fillStyle = filled ? "#ffffff" : "transparent";
    if (filled) ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = sw;
    ctx.stroke();
}

function drawElectricPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeWidth: number,
    seed: number,
    bubble: SpeechBubble,
) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";

    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const segments = 24;
    const rand = seededRandom(seed + 193);
    const baseRadius = Math.min(rx, ry);

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2;
        const zigzag = (i % 2 === 0 ? 1 : -1) * 0.18;
        const jitter = (rand() - 0.5) * 0.16;
        const r = baseRadius * (0.8 + zigzag + jitter);
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawStickerPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeWidth: number,
    seed: number,
    bubble: SpeechBubble,
) {
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const r = Math.min(w, h) * 0.12;
    const peel = Math.min(w, h) * 0.2;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - peel - r, y);
    ctx.quadraticCurveTo(x + w - peel, y, x + w - peel, y + r);
    ctx.lineTo(x + w - peel, y + peel);
    ctx.lineTo(x + w, y + peel);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBubbleFillOnly(ctx: CanvasRenderingContext2D, bubble: SpeechBubble) {
    const { x, y, width: w, height: h, style, strokeWidth: sw, wobble: wob, seed } = bubble;
    const isDoubleLine = style === "doubleline";
    const isImage = style === "image";

    if (isImage && bubble.templateImg) {
        ctx.drawImage(bubble.templateImg, x, y, w, h);
        return;
    }

    switch (style) {
        case "handwritten":
            drawHandwrittenPath(ctx, x, y, w, h, sw, seed);
            break;
        case "linedrawing":
            drawLinedrawingPath(ctx, x, y, w, h, sw);
            break;
        case "wobbly":
            drawWobblyPath(ctx, x, y, w, h, sw, wob);
            break;
        case "thought":
            drawThoughtPath(ctx, x, y, w, h, sw, seed);
            break;
        case "shout":
            drawShoutPath(ctx, x, y, w, h, sw, seed);
            break;
        case "rectangle":
            drawRectanglePath(ctx, x, y, w, h, sw);
            break;
        case "rounded":
            drawRoundedPath(ctx, x, y, w, h, sw);
            break;
        case "doubleline":
            drawDoublelinePath(ctx, x, y, w, h, sw);
            break;
        case "wavy":
            drawWavyPath(ctx, x, y, w, h, sw);
            break;
        case "flash_black":
        case "flash_normal":
        case "flash_dense":
            drawFlashStyle(ctx, x, y, w, h, sw, seed, style, {
                lineCount: bubble.flashLineCount ?? 24,
                lineLength: bubble.flashLineLength ?? 30,
                lineSpacing: bubble.flashLineSpacing ?? 0.3,
                lineThickness: bubble.flashLineThickness ?? sw * 0.8,
                bumpCount: bubble.flashBumpCount ?? 24,
                bumpHeight: bubble.flashBumpHeight ?? 10,
                innerRadius: bubble.flashInnerRadius ?? 0.65,
                filled: bubble.flashFilled ?? true,
            });
            return;
        case "polygon":
            drawPolygonPath(
                ctx,
                x,
                y,
                w,
                h,
                sw,
                seed,
                bubble.shapeSides ?? 6,
                bubble.shapeCornerRadius ?? 8,
                bubble.shapeWobble ?? 0,
            );
            break;
        case "spiky":
            drawSpikyPath(
                ctx,
                x,
                y,
                w,
                h,
                sw,
                seed,
                bubble.shapeSpikeCount ?? 12,
                bubble.shapeSpikeHeight ?? 20,
                bubble.shapeSpikeSharpness ?? 0.7,
                bubble.shapeWobble ?? 0,
            );
            break;
        case "cloud":
            drawCloudPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "electric":
            drawElectricPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "sticker":
            drawStickerPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "image":
            break;
    }

    if (!isDoubleLine) {
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }
}

function drawBubbleStrokeOnly(ctx: CanvasRenderingContext2D, bubble: SpeechBubble) {
    const { x, y, width: w, height: h, style, strokeWidth: sw, wobble: wob, seed } = bubble;
    const isImage = style === "image";

    if (isImage && bubble.templateImg) {
        return;
    }

    switch (style) {
        case "handwritten":
            drawHandwrittenPath(ctx, x, y, w, h, sw, seed);
            break;
        case "linedrawing":
            drawLinedrawingPath(ctx, x, y, w, h, sw);
            break;
        case "wobbly":
            drawWobblyPath(ctx, x, y, w, h, sw, wob);
            break;
        case "thought":
            drawThoughtPath(ctx, x, y, w, h, sw, seed);
            break;
        case "shout":
            drawShoutPath(ctx, x, y, w, h, sw, seed);
            break;
        case "rectangle":
            drawRectanglePath(ctx, x, y, w, h, sw);
            break;
        case "rounded":
            drawRoundedPath(ctx, x, y, w, h, sw);
            break;
        case "doubleline":
            drawDoublelinePath(ctx, x, y, w, h, sw);
            break;
        case "wavy":
            drawWavyPath(ctx, x, y, w, h, sw);
            break;
        case "flash_black":
        case "flash_normal":
        case "flash_dense":
            drawFlashStyle(ctx, x, y, w, h, sw, seed, style, {
                lineCount: bubble.flashLineCount ?? 24,
                lineLength: bubble.flashLineLength ?? 30,
                lineSpacing: bubble.flashLineSpacing ?? 0.3,
                lineThickness: bubble.flashLineThickness ?? sw * 0.8,
                bumpCount: bubble.flashBumpCount ?? 24,
                bumpHeight: bubble.flashBumpHeight ?? 10,
                innerRadius: bubble.flashInnerRadius ?? 0.65,
                filled: bubble.flashFilled ?? true,
            });
            return;
        case "polygon":
            drawPolygonPath(
                ctx,
                x,
                y,
                w,
                h,
                sw,
                seed,
                bubble.shapeSides ?? 6,
                bubble.shapeCornerRadius ?? 8,
                bubble.shapeWobble ?? 0,
            );
            break;
        case "spiky":
            drawSpikyPath(
                ctx,
                x,
                y,
                w,
                h,
                sw,
                seed,
                bubble.shapeSpikeCount ?? 12,
                bubble.shapeSpikeHeight ?? 20,
                bubble.shapeSpikeSharpness ?? 0.7,
                bubble.shapeWobble ?? 0,
            );
            break;
        case "cloud":
            drawCloudPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "electric":
            drawElectricPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "sticker":
            drawStickerPath(ctx, x, y, w, h, sw, seed, bubble);
            break;
        case "image":
            break;
    }

    ctx.strokeStyle = "#222";
    ctx.lineWidth = sw;
    ctx.stroke();
}

export function drawBubbleGroup(ctx: CanvasRenderingContext2D, bubbles: SpeechBubble[], isSelected: boolean) {
    if (bubbles.length === 0) return;

    const canvas = ctx.canvas;
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    bubbles.forEach((b) => {
        offCtx.save();
        drawBubbleFillOnly(offCtx, b);
        offCtx.restore();
    });

    ctx.drawImage(offscreen, 0, 0);

    bubbles.forEach((b) => {
        drawBubbleStrokeOnly(ctx, b);
    });

    const offscreen2 = document.createElement("canvas");
    offscreen2.width = canvas.width;
    offscreen2.height = canvas.height;
    const offCtx2 = offscreen2.getContext("2d");
    if (!offCtx2) return;

    bubbles.forEach((b) => {
        drawBubbleFillOnly(offCtx2, b);
    });

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(offscreen2, 0, 0);
    ctx.restore();

    bubbles.forEach((b) => {
        drawBubbleFillOnly(ctx, b);
    });

    bubbles.forEach((b) => {
        drawBubbleStrokeOnly(ctx, b);
    });

    if (isSelected) {
        const xs = bubbles.map((b) => b.x);
        const ys = bubbles.map((b) => b.y);
        const ws = bubbles.map((b) => b.x + b.width);
        const hs = bubbles.map((b) => b.y + b.height);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...ws);
        const maxY = Math.max(...hs);
        ctx.save();
        ctx.strokeStyle = "hsl(173, 80%, 45%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(minX - 4, minY - 4, (maxX - minX) + 8, (maxY - minY) + 8);
        ctx.restore();
    }
}

export function drawBubble(ctx: CanvasRenderingContext2D, bubble: SpeechBubble, isSelected: boolean) {
    ctx.save();

    const { x, y, width: w, height: h, style, strokeWidth: sw, wobble: wob, seed } = bubble;
    const hasTail = bubble.tailStyle === "long" || bubble.tailStyle === "short";
    const hasDots = bubble.tailStyle === "dots_handwritten" || bubble.tailStyle === "dots_linedrawing";
    const rand = seededRandom(seed + 1000);

    const isDoubleLine = style === "doubleline";
    const isImage = style === "image";
    const fillColor = bubble.fillColor ?? (style === "flash_black" ? "#000000" : "#ffffff");
    const strokeColor = bubble.strokeColor ?? "#222";
    const fillOpacity = (bubble.fillOpacity ?? 100) / 100;
    const drawMode = bubble.drawMode ?? "both";

    if (isImage && bubble.templateImg) {
        ctx.drawImage(bubble.templateImg, x, y, w, h);
    } else if (!isImage) {
        if (isDoubleLine) {
            drawDoublelinePath(ctx, x, y, w, h, sw);
            ctx.strokeStyle = "#222";
            ctx.stroke();
        } else {
            switch (style) {
                case "handwritten":
                    drawHandwrittenPath(ctx, x, y, w, h, sw, seed);
                    break;
                case "linedrawing":
                    drawLinedrawingPath(ctx, x, y, w, h, sw);
                    break;
                case "wobbly":
                    drawWobblyPath(ctx, x, y, w, h, sw, wob);
                    break;
                case "thought":
                    drawThoughtPath(ctx, x, y, w, h, sw, seed);
                    break;
                case "shout":
                    drawShoutPath(ctx, x, y, w, h, sw, seed);
                    break;
                case "rectangle":
                    drawRectanglePath(ctx, x, y, w, h, sw);
                    break;
                case "rounded":
                    drawRoundedPath(ctx, x, y, w, h, sw);
                    break;
                case "wavy":
                    drawWavyPath(ctx, x, y, w, h, sw);
                    break;
                case "flash_black":
                case "flash_normal":
                case "flash_dense":
                    drawFlashStyle(ctx, x, y, w, h, sw, seed, style, {
                        lineCount: bubble.flashLineCount ?? 24,
                        lineLength: bubble.flashLineLength ?? 30,
                        lineSpacing: bubble.flashLineSpacing ?? 0.3,
                        lineThickness: bubble.flashLineThickness ?? sw * 0.8,
                        bumpCount: bubble.flashBumpCount ?? 24,
                        bumpHeight: bubble.flashBumpHeight ?? 10,
                        innerRadius: bubble.flashInnerRadius ?? 0.65,
                        filled: bubble.flashFilled ?? true,
                    });
                    break;
                case "cloud":
                    drawCloudPath(ctx, x, y, w, h, sw, seed, bubble);
                    break;
                case "electric":
                    drawElectricPath(ctx, x, y, w, h, sw, seed, bubble);
                    break;
                case "sticker":
                    drawStickerPath(ctx, x, y, w, h, sw, seed, bubble);
                    break;
            }

            // 항상 body fill/stroke (hasTail 여부 무관)
            if (drawMode !== "stroke_only") {
                ctx.fillStyle = fillColor;
                ctx.globalAlpha = fillOpacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            if (drawMode !== "fill_only") {
                ctx.strokeStyle = strokeColor;
                ctx.stroke();
            }
        }
    }

    if (hasTail) {
        const geo = getTailGeometry(bubble);
        const cx = bubble.x + bubble.width / 2;
        const cy = bubble.y + bubble.height / 2;
        const rx = bubble.width / 2;
        const ry = bubble.height / 2;

        const curvePull = bubble.tailCurve ?? 0.5;
        const baseMidX = (geo.baseAx + geo.baseBx) / 2;
        const baseMidY = (geo.baseAy + geo.baseBy) / 2;
        const jitter = bubble.tailJitter ?? 0;
        const rand = seededRandom(bubble.seed + 999);
        const jitterScale = jitter * 10;

        const baseC1x = geo.baseAx + (baseMidX - geo.baseAx) * (0.5 + curvePull * 0.45);
        const baseC1y = geo.baseAy + (baseMidY - geo.baseAy) * (0.5 + curvePull * 0.45);
        const baseC2x = geo.tipX + (baseMidX - geo.tipX) * 0.3;
        const baseC2y = geo.tipY + (baseMidY - geo.tipY) * 0.3;

        const hasCtrl1 = typeof bubble.tailCtrl1X === "number" && typeof bubble.tailCtrl1Y === "number";
        const hasCtrl2 = typeof bubble.tailCtrl2X === "number" && typeof bubble.tailCtrl2Y === "number";

        const c1 = hasCtrl1
            ? { x: bubble.tailCtrl1X as number, y: bubble.tailCtrl1Y as number }
            : { x: baseC1x + (rand() - 0.5) * jitterScale, y: baseC1y + (rand() - 0.5) * jitterScale };
        const c2 = hasCtrl2
            ? { x: bubble.tailCtrl2X as number, y: bubble.tailCtrl2Y as number }
            : { x: baseC2x + (rand() - 0.5) * jitterScale, y: baseC2y + (rand() - 0.5) * jitterScale };
        const c3 = { x: c2.x, y: c2.y };
        const c4 = {
            x: geo.baseBx + (baseMidX - geo.baseBx) * (0.5 + curvePull * 0.45),
            y: geo.baseBy + (baseMidY - geo.baseBy) * (0.5 + curvePull * 0.45),
        };

        // Step 1: 꼬리 fill (body fill과 완전히 이어지도록 덮어씀)
        ctx.beginPath();
        ctx.moveTo(geo.baseAx, geo.baseAy);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, geo.tipX, geo.tipY);
        ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, geo.baseBx, geo.baseBy);
        ctx.closePath(); // 직선으로 baseB → baseA (body 내부이므로 안 보임)
        if (drawMode !== "stroke_only") {
            ctx.fillStyle = fillColor;
            ctx.globalAlpha = fillOpacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Step 2: body stroke의 꼬리 부착 구간만 destination-out으로 지우기
        if (drawMode !== "fill_only") {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, geo.angleA - 0.06, geo.angleB + 0.06, false);
            ctx.lineWidth = sw * 4;
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.stroke();
            ctx.restore();

            // Step 3: 꼬리 측면선만 그리기 (arc 제외 - 이음새 없음)
            ctx.beginPath();
            ctx.moveTo(geo.baseAx, geo.baseAy);
            ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, geo.tipX, geo.tipY);
            ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, geo.baseBx, geo.baseBy);
            ctx.lineWidth = sw;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
        }
    }

    if (hasDots) {
        const cx2 = bubble.x + bubble.width / 2;
        const cy2 = bubble.y + bubble.height / 2;
        const isHandwritten = bubble.tailStyle === "dots_handwritten";
        const defaultTip = getDefaultTailTip(bubble) || { x: cx2 + 10, y: cy2 + 50 };
        const dotTipX = bubble.tailTipX ?? defaultTip.x;
        const dotTipY = bubble.tailTipY ?? defaultTip.y;
        const dotAngle = Math.atan2(dotTipY - cy2, dotTipX - cx2);
        const startX = cx2 + Math.cos(dotAngle) * (bubble.width / 2) + Math.cos(dotAngle) * 5;
        const startY = cy2 + Math.sin(dotAngle) * (bubble.height / 2) + Math.sin(dotAngle) * 5;
        const dirX = Math.cos(dotAngle);
        const dirY = Math.sin(dotAngle);

        const scale = bubble.dotsScale ?? 1;
        const spacing = bubble.dotsSpacing ?? 1;
        const dots = [
            { size: 8 * scale, dist: 12 * spacing },
            { size: 6 * scale, dist: 26 * spacing },
            { size: 4 * scale, dist: 38 * spacing },
        ];

        dots.forEach(({ size, dist }) => {
            const jitterScale = bubble.tailJitter ?? 1;
            const dx = startX + dirX * dist + (isHandwritten ? (rand() - 0.5) * 4 * jitterScale : 0);
            const dy = startY + dirY * dist + (isHandwritten ? (rand() - 0.5) * 4 * jitterScale : 0);
            ctx.beginPath();
            if (isHandwritten) {
                const segments = 12;
                for (let i = 0; i <= segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    const jx = (rand() - 0.5) * 2 * jitterScale;
                    const jy = (rand() - 0.5) * 2 * jitterScale;
                    const px = dx + Math.cos(angle) * size + jx;
                    const py = dy + Math.sin(angle) * size + jy;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
            } else {
                ctx.arc(dx, dy, size, 0, Math.PI * 2);
            }
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fill();
            ctx.strokeStyle = "#222";
            ctx.lineWidth = sw * 0.8;
            ctx.stroke();
        });
    }

    if (bubble.text) {
        const isFlash =
            style === "flash_black" || style === "flash_normal" || style === "flash_dense";
        const textColor = style === "flash_black" ? "#ffffff" : "#222";

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${bubble.fontSize}px ${getFontFamily(bubble.fontKey)}`;
        const padding = 10;
        const innerRadius = isFlash ? (bubble.flashInnerRadius ?? 0.65) : 1;
        const contentWidth = w * innerRadius;
        const maxTextW = contentWidth - padding * 2;
        const rawLines = bubble.text.split("\n");
        const wrappedLines: string[] = [];
        rawLines.forEach((rawLine) => {
            if (!rawLine) { wrappedLines.push(""); return; }
            let current = "";
            for (const ch of rawLine) {
                const test = current + ch;
                if (ctx.measureText(test).width > maxTextW && current) {
                    wrappedLines.push(current);
                    current = ch;
                } else {
                    current = test;
                }
            }
            if (current) wrappedLines.push(current);
        });
        const lineHeight = bubble.fontSize * 1.3;
        const totalHeight = wrappedLines.length * lineHeight;
        const textStartY = y + h / 2 - totalHeight / 2 + lineHeight / 2;
        wrappedLines.forEach((line, i) => {
            ctx.fillText(line, x + w / 2, textStartY + i * lineHeight);
        });
    }

    if (isSelected) {
        ctx.strokeStyle = "hsl(173, 80%, 45%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
        ctx.setLineDash([]);

        const handleSize = 9;
        const handles = [
            { x: x - 4, y: y - 4 },
            { x: x + w / 2, y: y - 4 },
            { x: x + w + 4, y: y - 4 },
            { x: x + w + 4, y: y + h / 2 },
            { x: x + w + 4, y: y + h + 4 },
            { x: x + w / 2, y: y + h + 4 },
            { x: x - 4, y: y + h + 4 },
            { x: x - 4, y: y + h / 2 },
        ];

        handles.forEach((handle) => {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.96)";
            ctx.fill();
            ctx.strokeStyle = "hsl(173, 80%, 45%)";
            ctx.lineWidth = 1.8;
            ctx.stroke();
        });

        if (bubble.tailStyle !== "none") {
            const geo = getTailGeometry(bubble);
            const baseCx = (geo.baseAx + geo.baseBx) / 2;
            const baseCy = (geo.baseAy + geo.baseBy) / 2;
            const pull = 0.97;
            const tipPull = 0.6;

            // tip 핸들 (파란 원)
            ctx.beginPath();
            ctx.arc(geo.tipX, geo.tipY, 7, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.96)";
            ctx.fill();
            ctx.strokeStyle = "hsl(173, 80%, 45%)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // control point 핸들 (노란 마름모 2개)
            const cp1x = bubble.tailCtrl1X ?? (geo.baseAx + (baseCx - geo.baseAx) * pull);
            const cp1y = bubble.tailCtrl1Y ?? (geo.baseAy + (baseCy - geo.baseAy) * pull);
            const cp2x = bubble.tailCtrl2X ?? (geo.tipX + (baseCx - geo.tipX) * tipPull);
            const cp2y = bubble.tailCtrl2Y ?? (geo.tipY + (baseCy - geo.tipY) * tipPull);

            // 가이드 선 (control point → 연결점)
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,220,0,0.6)";
            ctx.beginPath();
            ctx.moveTo(geo.baseAx, geo.baseAy);
            ctx.lineTo(cp1x, cp1y);
            ctx.moveTo(geo.tipX, geo.tipY);
            ctx.lineTo(cp2x, cp2y);
            ctx.stroke();
            ctx.setLineDash([]);

            [{ x: cp1x, y: cp1y, mode: "tail-ctrl1" }, { x: cp2x, y: cp2y, mode: "tail-ctrl2" }]
                .forEach(({ x, y }) => {
                    ctx.beginPath();
                    ctx.moveTo(x, y - 7);
                    ctx.lineTo(x + 7, y);
                    ctx.lineTo(x, y + 7);
                    ctx.lineTo(x - 7, y);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(255,220,0,0.95)";
                    ctx.fill();
                    ctx.strokeStyle = "hsl(173, 80%, 45%)";
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                });
        }
    }

    ctx.restore();
}
