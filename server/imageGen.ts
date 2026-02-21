import { GoogleGenAI, Modality } from "@google/genai";
import type { Character } from "@shared/schema";

// 개발 모드에서 API 키가 없으면 더미 클라이언트 생성
let ai: GoogleGenAI;
try {
  if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Gemini API 키가 설정되지 않았습니다. 이미지 생성 기능이 동작하지 않습니다.");
      // 더미 클라이언트 생성 (실제 사용 시 에러 발생)
      ai = new GoogleGenAI({
        apiKey: "dummy-key",
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "https://dummy.api",
        },
      });
    } else {
      throw new Error("AI_INTEGRATIONS_GEMINI_API_KEY must be set");
    }
  } else {
    ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
  }
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️  Gemini 클라이언트 생성 실패:", error);
    ai = new GoogleGenAI({
      apiKey: "dummy-key",
      httpOptions: {
        apiVersion: "",
        baseUrl: "https://dummy.api",
      },
    });
  } else {
    throw error;
  }
}

const stylePrompts: Record<string, { keywords: string; instruction: string }> = {
  "simple-line": {
    keywords: "very simple line drawing, thick black outlines, minimal details, cute rounded shapes, clean white background, korean instagram webtoon (instatoon) style, doodle-like simplicity, flat colors with minimal shading, adorable and slightly silly character",
    instruction: `Draw in a very SIMPLE, minimal Korean Instagram webtoon (instatoon) style. The character must look like a simple doodle - NOT detailed, NOT realistic, NOT fancy. Think of simple Korean Instagram comic characters with:
- Very thick, clean black outlines
- Minimal facial features (dot eyes, simple mouth)
- Round, cute body proportions
- Very few details - keep it as simple as possible
- Clean white background
- Flat colors with no complex shading
- Charming and slightly silly feeling`,
  },
  "cute-animal": {
    keywords: "super simple cute animal character, thick black outlines, minimal features, round body shape, tiny limbs, clean white background, korean instagram webtoon (instatoon) style, kawaii doodle, very few details, flat pastel colors",
    instruction: `Draw a super cute, simple animal character in Korean Instagram webtoon (instatoon) style. The character must be:
- Very round and cute body shape with tiny limbs
- Thick black outlines
- Minimal facial features (dot eyes, small simple mouth)
- Kawaii/귀여운 style
- Clean white background
- Flat pastel colors, very few details`,
  },
  "doodle": {
    keywords: "rough hand-drawn doodle comic, loose expressive pen lines, casual messy sketch, korean instagram webtoon instatoon doodle like hoho80887 iwsurvive00, rough charming illustration, hand-drawn comic panel feel, unpolished raw doodle art, marker pen casual drawing, expressive loose linework, imperfect endearing character sketch",
    instruction: `Draw in an authentic Korean Instagram webtoon DOODLE style (낙서풍) - like popular Korean instatoon artists who draw rough, casual, expressive comics. This is NOT a clean or polished style. Key requirements:
- ROUGH, LOOSE, EXPRESSIVE pen/marker lines - lines should look genuinely hand-drawn, unsteady, and imperfect
- NOT clean, NOT polished, NOT precise - the charm is in the roughness and rawness
- Think of Korean instatoon accounts like hoho80887 or iwsurvive00 - their drawings look like quick rough doodles but are full of personality and expression
- Lines can vary in thickness, can overlap, can be messy - this adds character
- Simple but EXPRESSIVE features - the character should have clear emotions even with rough drawing
- Flat, simple coloring is okay - or just black outlines on white
- The feeling should be like someone grabbed a pen and quickly drew a funny comic character
- NOT anime, NOT digital art, NOT professional illustration - this should look hand-drawn on paper
- White or simple solid color background
- The character should feel alive and expressive despite the rough drawing style`,
  },
  "minimal": {
    keywords: "extremely minimalist character design, simple geometric shapes, dot eyes, small mouth, thick clean outlines, clean white background, korean instagram webtoon (instatoon) style, understated and cute, very few lines and details, geometric minimalism",
    instruction: `Draw an EXTREMELY minimalist character. The simplest possible design with the fewest lines. Think geometric shapes:
- Character made of basic geometric shapes (circles, ovals, rectangles)
- Absolute minimum number of lines and strokes
- Dot eyes and tiny simple mouth only
- Thick clean outlines but VERY few of them
- Clean white background
- Flat simple colors or even monochrome
- The most stripped-down, bare-minimum character possible`,
  },
  "scribble": {
    keywords: "scribble handwriting style comic, wiggly wobbly continuous pen lines, ballpoint pen scrawl drawing, scratchy energetic hand-drawn character, korean instagram webtoon instatoon scribble style, rough scribbly outlines like real handwriting, pen pressure variation, overlapping scratchy strokes, raw unfiltered doodle energy, hand-drawn on paper feel",
    instruction: `Draw a character in authentic Korean instatoon SCRIBBLE style (구불구불 손글씨) - where the lines look like actual handwriting/scrawling with a pen. This style is characterized by WOBBLY, SCRIBBLY, CONTINUOUS pen strokes. Key requirements:
- Lines must be genuinely WOBBLY and SCRIBBLY - like writing/scrawling with a ballpoint pen, NOT smooth digital lines
- SCRATCHY, overlapping strokes are encouraged - real pen drawings have this quality where the artist goes over lines multiple times
- The line quality should look like someone drawing with the same casual energy as writing a quick note
- Pen pressure variation - some lines thicker, some thinner, naturally uneven
- Simple character with expressive features - big emotions communicated through rough, energetic linework
- Think of Korean instatoon artists who draw with a deliberately rough, scribbly, handwriting-like quality
- The character should look like it was drawn in 30 seconds with a ballpoint pen on notebook paper
- NOT clean, NOT smooth, NOT digital-looking - the beauty is in the raw, scribbly, handwritten quality
- White or simple background
- Lines can be slightly messy where they connect - this is authentic to the style`,
  },
  "ink-sketch": {
    keywords: "expressive ink brush sketch, loose dynamic brush pen drawing, bold ink strokes with natural variation, korean instagram webtoon instatoon ink style like leeyounghwan, brush pen illustration, dynamic flowing ink lines, quick confident brush strokes, monochrome ink character art, expressive hand-drawn ink comic, asian ink drawing style",
    instruction: `Draw a character in expressive Korean instatoon INK SKETCH style (잉크 스케치) - like popular Korean Instagram comic artists who draw with brush pens or ink pens. This style has bold, confident, dynamic strokes. Key requirements:
- Bold, expressive INK strokes with natural variation in thickness - thick to thin transitions from brush/pen pressure
- Confident, dynamic linework - NOT timid, NOT scratchy - these are decisive brush strokes
- Natural ink qualities: some lines thick and bold, some thin and delicate, flowing transitions
- Loose and expressive but with clear intent - like a skilled artist drawing quickly with a brush pen
- Character should have personality and expression conveyed through the ink linework
- Primarily monochrome (black ink) with optional minimal gray wash tones
- Think of Korean instatoon artists who use brush pens to create expressive, dynamic character illustrations
- White or cream background
- The beauty is in the CONTRAST between thick bold strokes and thin delicate lines
- NOT digital, NOT clean vectors - this should look like real ink on paper
- Slightly loose where lines meet - authentic ink drawing quality`,
  },
};

const defaultStyle = stylePrompts["simple-line"];
const fallbackStyles = ["webtoon", "anime", "realistic", "pixar"];

function getStyleConfig(style: string) {
  if (stylePrompts[style]) return stylePrompts[style];
  return defaultStyle;
}

const noTextRule = `CRITICAL: Do NOT include ANY text, letters, words, labels, captions, watermarks, or writing of any kind in the image. The image must contain ONLY the visual illustration with absolutely zero text.`;

export async function generateCharacterImage(prompt: string, style: string): Promise<string> {
  const config = getStyleConfig(style);
  const fullPrompt = `${config.instruction}

${noTextRule}

IMPORTANT: The character must be on a completely plain solid white background with NOTHING else - no shadows, no ground, no decorations, no patterns. Just the character floating on pure white. This is critical because the image will be used as a sticker/cutout.

IMPORTANT: Generate the image in 3:4 portrait aspect ratio (width:height = 3:4). The image must be taller than it is wide.

Create a character: ${prompt}. 
Style: ${config.keywords}. 
Single character only, full body view, pure solid white background, no shadows on background. Do NOT write any text or words in the image.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Failed to generate image - no image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function generatePoseImage(
  character: Character,
  posePrompt: string,
  referenceImageData?: string
): Promise<string> {
  const config = getStyleConfig(character.style);

  const parts: any[] = [];

  parts.push({
    text: `${config.instruction}

${noTextRule}

Generate a new pose of the same character described below. Keep the character looking EXACTLY the same - same style, same features, same colors. Only change the pose and expression.

IMPORTANT: Generate the image in 4:3 aspect ratio (width:height = 4:3). The image should be slightly wider than it is tall.

Original character description: ${character.prompt}
Style: ${config.keywords}
New pose/expression: ${posePrompt}

Keep the SAME style. Single character. Do NOT write any text or words in the image.`
  });

  if (character.imageUrl.startsWith("data:")) {
    const match = character.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        }
      });
      parts[0] = {
        text: `${config.instruction}

${noTextRule}

Look at this reference character image. Generate the EXACT SAME character in a different pose. Keep it in the same style - same line thickness, same level of detail, same colors.

IMPORTANT: Generate the image in 4:3 aspect ratio (width:height = 4:3). The image should be slightly wider than it is tall.

New pose/expression: ${posePrompt}
Style: ${config.keywords}

Keep the character identical to the reference. Only change the pose. Single character. Do NOT write any text or words in the image.`
      };
    }
  }

  if (referenceImageData && referenceImageData.startsWith("data:")) {
    const match = referenceImageData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Failed to generate pose - no image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function generateWithBackground(
  sourceImageData: string,
  backgroundPrompt: string,
  itemsPrompt?: string
): Promise<string> {
  const parts: any[] = [];

  const itemsInstruction = itemsPrompt
    ? `Also add these items/props around or with the character: ${itemsPrompt}.`
    : "";

  parts.push({
    text: `Take this character image and place the character into a new scene with a background and optional items.

IMPORTANT RULES:
- Keep the character looking EXACTLY the same - same style, same features, same colors, same proportions
- The character should be the main focus of the image
- Draw the background in a style that matches the character (simple, cute, instatoon style)
- The background should complement the character, not overwhelm it
- Keep the overall style simple and cute, matching Korean Instagram webtoon (instatoon) aesthetics

Background scene: ${backgroundPrompt}
${itemsInstruction}

IMPORTANT: Generate the image in 4:3 aspect ratio (width:height = 4:3). The scene should be slightly wider than it is tall.

Make the background and items in the same simple, cute drawing style as the character. Keep thick outlines and flat colors. Do NOT write any text or words in the image.`
  });

  const match = sourceImageData.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    parts.push({
      inlineData: {
        mimeType: match[1],
        data: match[2],
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const bgImagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData
  );

  if (!bgImagePart?.inlineData?.data) {
    throw new Error("Failed to generate background - no image data in response");
  }

  const bgMimeType = bgImagePart.inlineData.mimeType || "image/png";
  return `data:${bgMimeType};base64,${bgImagePart.inlineData.data}`;
}
