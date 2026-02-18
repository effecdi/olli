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

export const STYLE_LABELS: Record<BubbleStyle, string> = {
    linedrawing: "심플 라인",
    handwritten: "손글씨",
    rounded: "둥근 사각형",
    rectangle: "사각형",
    thought: "생각 구름",
    shout: "외침 / 효과",
    wobbly: "불안한 말풍선",
    doubleline: "이중선",
    wavy: "물결",
    image: "이미지 말풍선",
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
    // bubble.tailDirection is not optional in interface but might be missing in partial
    const cx = bubble.x + bubble.width / 2;
    const cy = bubble.y + bubble.height / 2;
    const defaultTip = getDefaultTailTip(bubble) || { x: cx + 10, y: bubble.y + bubble.height + 50 }; // fallback
    const tipX = bubble.tailTipX ?? defaultTip.x;
    const tipY = bubble.tailTipY ?? defaultTip.y;

    const angle = Math.atan2(tipY - cy, tipX - cx);
    const perpAngle = angle + Math.PI / 2;
    const baseSpread = bubble.tailBaseSpread ?? 8;

    const edgeX = cx + Math.cos(angle) * (bubble.width / 2);
    const edgeY = cy + Math.sin(angle) * (bubble.height / 2);

    const baseAx = edgeX + Math.cos(perpAngle) * baseSpread;
    const baseAy = edgeY + Math.sin(perpAngle) * baseSpread;
    const baseBx = edgeX - Math.cos(perpAngle) * baseSpread;
    const baseBy = edgeY - Math.sin(perpAngle) * baseSpread;

    const tailLen = Math.sqrt((tipX - cx) ** 2 + (tipY - cy) ** 2);

    return { tipX, tipY, baseAx, baseAy, baseBx, baseBy, tailLen };
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

export function drawBubble(ctx: CanvasRenderingContext2D, bubble: SpeechBubble, isSelected: boolean) {
    ctx.save();

    const { x, y, width: w, height: h, style, strokeWidth: sw, wobble: wob, seed } = bubble;
    const hasTail = bubble.tailStyle === "long" || bubble.tailStyle === "short";
    const hasDots = bubble.tailStyle === "dots_handwritten" || bubble.tailStyle === "dots_linedrawing";
    const rand = seededRandom(seed + 1000);

    const isDoubleLine = style === "doubleline";
    const isImage = style === "image";

    if (isImage && bubble.templateImg) {
        ctx.drawImage(bubble.templateImg, x, y, w, h);
    } else if (!isImage) {
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
        }

        if (!isDoubleLine) {
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#222";
            ctx.stroke();
        } else {
            ctx.strokeStyle = "#222";
            ctx.stroke();
        }
    }

    if (hasTail) {
        const geo = getTailGeometry(bubble);
        const baseCx = (geo.baseAx + geo.baseBx) / 2;
        const baseCy = (geo.baseAy + geo.baseBy) / 2;

        const pA = { x: geo.baseAx, y: geo.baseAy };
        const pB = { x: geo.baseBx, y: geo.baseBy };
        const pTip = { x: geo.tipX, y: geo.tipY };

        const pull = 0.75;

        const c1 = {
            x: pA.x + (baseCx - pA.x) * pull,
            y: pA.y + (baseCy - pA.y) * pull,
        };
        const c2 = {
            x: pTip.x + (baseCx - pTip.x) * 0.15,
            y: pTip.y + (baseCy - pTip.y) * 0.15,
        };

        const c3 = {
            x: pTip.x + (baseCx - pTip.x) * 0.15,
            y: pTip.y + (baseCy - pTip.y) * 0.15,
        };
        const c4 = {
            x: pB.x + (baseCx - pB.x) * pull,
            y: pB.y + (baseCy - pB.y) * pull,
        };

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, pTip.x, pTip.y);
        ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, pB.x, pB.y);
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = sw;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = "#222";
        ctx.stroke();
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
        ctx.fillStyle = "#222";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${bubble.fontSize}px ${getFontFamily(bubble.fontKey)}`;
        const padding = 10;
        const maxTextW = w - padding * 2;
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
            ctx.beginPath();
            ctx.arc(geo.tipX, geo.tipY, 7, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.96)";
            ctx.fill();
            ctx.strokeStyle = "hsl(173, 80%, 45%)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    ctx.restore();
}
