import { GoogleGenAI } from "@google/genai";

// 개발 모드에서 API 키가 없으면 더미 클라이언트 생성
let ai: GoogleGenAI;
try {
  if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Gemini API 키가 설정되지 않았습니다. AI 텍스트 생성 기능이 동작하지 않습니다.");
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

export async function generateAIPrompt(type: "character" | "pose" | "background", context?: string): Promise<string> {
  const prompts: Record<string, string> = {
    character: `인스타툰 캐릭터 설명을 10~20자로 아주 짧게 1개 생성해줘.
예시: "큰 안경 쓴 뚱뚱한 고양이", "베레모 쓴 곱슬머리 소녀", "망토 입은 아기 용"
텍스트만 출력 (따옴표, 설명 없이):`,

    pose: `당신은 인스타툰(인스타그램 웹툰) 포즈/표정 전문가입니다.
${context ? `캐릭터 정보: ${context}\n` : ""}
캐릭터의 재미있고 매력적인 포즈나 표정을 묘사하는 프롬프트를 한국어로 1개 생성해주세요.

가이드:
- 구체적인 포즈와 표정을 함께 묘사
- 인스타툰에서 자주 쓰이는 감정 표현 포함
- 20~40자 정도의 간결한 설명
- 다양한 상황: 일상, 감정 표현, 리액션 등

프롬프트만 작성해주세요 (따옴표나 추가 설명 없이 순수 텍스트만):`,

    background: `당신은 인스타툰(인스타그램 웹툰) 배경/아이템 전문가입니다.
인스타툰 캐릭터에 어울리는 배경과 소품을 묘사하는 프롬프트를 한국어로 생성해주세요.

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이 순수 JSON만):
{
  "background": "배경 설명 (20~40자)",
  "items": "소품/아이템 설명 (10~30자)"
}

가이드:
- 인스타툰에 적합한 귀엽고 아기자기한 배경
- 배경과 어울리는 소품을 함께 추천
- 카페, 공원, 방, 거리, 계절 풍경 등 다양하게
- MZ세대 감성의 트렌디한 장소`,
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompts[type] }] }],
  });

  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  if (!textPart?.text) {
    throw new Error("Failed to generate AI prompt");
  }

  return textPart.text.trim().replace(/^["']|["']$/g, '');
}

export async function analyzeAdMatch(data: {
  genre: string;
  followers: string;
  ageGroup: string;
  contentStyle: string;
  postFrequency: string;
  engagement: string;
}): Promise<{
  recommendations: Array<{
    category: string;
    brands: string[];
    matchScore: number;
    reason: string;
    expectedCPM: string;
  }>;
  insights: string;
}> {
  const prompt = `당신은 인스타툰 크리에이터와 광고주를 매칭하는 전문가입니다. 다음 인스타툰 정보를 분석하여 적합한 광고주 3개를 추천해주세요.

인스타툰 정보:
- 장르: ${data.genre}
- 팔로워 수: ${data.followers}명
- 주요 연령층: ${data.ageGroup}
- 콘텐츠 스타일: ${data.contentStyle}
- 포스팅 빈도: 주 ${data.postFrequency}회
- 평균 참여율: ${data.engagement}%

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이 순수 JSON만):
{
  "recommendations": [
    {
      "category": "광고주 카테고리",
      "brands": ["브랜드1", "브랜드2", "브랜드3"],
      "matchScore": 95,
      "reason": "추천 이유 (1-2문장)",
      "expectedCPM": "예상 CPM 범위"
    }
  ],
  "insights": "전체적인 인사이트 (2-3문장)"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  if (!textPart?.text) {
    throw new Error("Failed to generate ad match analysis");
  }

  const cleanedText = textPart.text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleanedText);
  return parsed;
}

export async function enhanceBio(data: {
  bio: string;
  profileName: string;
  category: string;
  followers?: string;
  engagement?: string;
}): Promise<string> {
  const prompt = `당신은 인스타그램 인스타툰 크리에이터의 미디어킷 전문 작성가입니다. 
크리에이터가 간단히 작성한 자기소개를 기반으로, 광고주에게 매력적으로 어필할 수 있는 전문적이고 세련된 소개문을 한국어로 작성해주세요.

크리에이터 정보:
- 이름: ${data.profileName || "미입력"}
- 카테고리: ${data.category || "미입력"}
- 팔로워: ${data.followers ? data.followers + "명" : "미입력"}
- 참여율: ${data.engagement ? data.engagement + "%" : "미입력"}

크리에이터가 작성한 간단한 소개:
"${data.bio}"

작성 가이드:
1. 크리에이터의 강점과 콘텐츠 특징을 부각시켜주세요
2. 광고주 관점에서 매력적인 협업 포인트를 강조해주세요
3. 전문적이면서도 친근한 톤을 유지해주세요
4. 3~5문장 정도로 작성해주세요
5. 숫자나 통계가 있다면 자연스럽게 포함해주세요

소개문만 작성해주세요 (따옴표나 추가 설명 없이 순수 텍스트만):`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  if (!textPart?.text) {
    throw new Error("Failed to enhance bio");
  }

  return textPart.text.trim().replace(/^["']|["']$/g, '');
}

export async function generateStoryScripts(data: {
  topic: string;
  panelCount: number;
  posePrompt?: string;
  expressionPrompt?: string;
  itemPrompt?: string;
  backgroundPrompt?: string;
}): Promise<{
  panels: Array<{ top: string; bottom: string; bubbles: Array<{ text: string; style?: string }> }>;
}> {
  const details: string[] = [];
  if (data.posePrompt || data.expressionPrompt) {
    details.push(
      `- 포즈/표정: ${data.posePrompt || ""}${data.expressionPrompt ? `, ${data.expressionPrompt}` : ""}`,
    );
  }
  if (data.backgroundPrompt) {
    details.push(`- 배경: ${data.backgroundPrompt}`);
  }
  if (data.itemPrompt) {
    details.push(`- 아이템/소품: ${data.itemPrompt}`);
  }

  const extraGuide =
    details.length > 0
      ? `
추가 연출 가이드:
${details.join("\n")}
위 내용을 최대한 반영해서 각 패널의 상황과 대사를 만들어주세요.`
      : "";

  const prompt = `당신은 인스타툰(인스타그램 웹툰) 스크립트 작가입니다. 주어진 주제로 ${data.panelCount}개 패널(컷)에 들어갈 스크립트와 말풍선 대사를 작성해주세요.

주제: "${data.topic}"
패널 수: ${data.panelCount}

${extraGuide}

각 패널에는 다음 텍스트가 들어갑니다:
- top: 상단 스크립트 (나레이션이나 상황 설명, 짧게 1문장)
- bottom: 하단 스크립트 (캐릭터의 독백이나 부연 설명, 짧게 1문장)
- bubbles: 말풍선 대사 배열 (캐릭터 대사, 감정 표현 등 - 패널당 1~3개)
  - 각 bubble의 style은 "handwritten"(손글씨), "linedrawing"(라인), "wobbly"(물결) 중 하나
  - 대사의 분위기에 맞게 style을 선택하세요 (감정적→handwritten, 일반→linedrawing, 놀람/강조→wobbly)

작성 가이드:
1. 인스타툰 특유의 짧고 임팩트 있는 문장을 사용하세요
2. 한국 MZ세대가 공감할 수 있는 자연스러운 한국어 구어체를 사용하세요
3. 각 패널이 순서대로 이야기가 자연스럽게 이어지도록 작성하세요
4. 마지막 패널은 반전이나 펀치라인으로 마무리해주세요
5. ㅋㅋ, ㅠㅠ, ~, ... 등 인스타툰에서 자주 쓰이는 표현을 적절히 사용하세요
6. 패널마다 말풍선 개수를 다르게 해서 자연스러운 대화 흐름을 만드세요

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이 순수 JSON만):
{
  "panels": [
    {
      "top": "상단 스크립트",
      "bottom": "하단 스크립트",
      "bubbles": [
        { "text": "말풍선 대사", "style": "handwritten" }
      ]
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  if (!textPart?.text) {
    throw new Error("Failed to generate story scripts");
  }

  const cleanedText = textPart.text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanedText);
}

export async function suggestStoryTopics(genre?: string): Promise<string[]> {
  const genreHint = genre ? `장르 힌트: ${genre}\n` : "";
  const prompt = `당신은 인스타툰(인스타그램 웹툰) 주제 추천 전문가입니다.
${genreHint}
MZ세대가 공감하고 좋아할 만한 인스타툰 주제를 5개 추천해주세요.
일상, 유머, 공감, 연애, 직장 등 다양한 카테고리에서 추천해주세요.
각 주제는 짧고 명확하게 작성하세요 (예: "월요일 출근길의 비극", "카페에서 벌어진 일").

다음 JSON 형식으로만 응답해주세요 (다른 설명 없이 순수 JSON만):
["주제1", "주제2", "주제3", "주제4", "주제5"]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  if (!textPart?.text) {
    throw new Error("Failed to suggest topics");
  }

  const cleanedText = textPart.text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanedText);
}
