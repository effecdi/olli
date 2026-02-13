import { PenTool, Paintbrush, Star, Trophy } from "lucide-react";

export const TIERS = [
  {
    index: 0,
    name: "입문 작가",
    icon: PenTool,
    minGen: 0,
    maxGen: 4,
    color: "text-muted-foreground",
    badge: "시작",
    dailyCredits: 3,
    maxPanels: 3,
    benefits: ["하루 3회 무료 생성", "3가지 스타일 사용", "포즈 & 배경 생성", "말풍선 편집기 (매일 3회)"],
    nextUnlock: "스토리 패널 5개 + 말풍선 에디터",
  },
  {
    index: 1,
    name: "신인 작가",
    icon: Paintbrush,
    minGen: 5,
    maxGen: 14,
    color: "text-blue-500 dark:text-blue-400",
    badge: "5회+",
    dailyCredits: 3,
    maxPanels: 5,
    benefits: ["하루 3회 무료 생성", "스토리 패널 5개", "블러 효과 사용", "말풍선 에디터"],
    nextUnlock: "스토리 패널 8개",
  },
  {
    index: 2,
    name: "인기 작가",
    icon: Star,
    minGen: 15,
    maxGen: 29,
    color: "text-amber-500 dark:text-amber-400",
    badge: "15회+",
    dailyCredits: 3,
    maxPanels: 8,
    benefits: ["하루 3회 무료 생성", "스토리 패널 8개", "포즈 & 배경 생성", "말풍선 에디터"],
    nextUnlock: "스토리 패널 10개 + 전체 폰트 해금",
  },
  {
    index: 3,
    name: "프로 연재러",
    icon: Trophy,
    minGen: 30,
    maxGen: Infinity,
    color: "text-primary",
    badge: "30회+",
    dailyCredits: 3,
    maxPanels: 10,
    benefits: ["하루 3회 무료 생성", "스토리 패널 10개", "전체 폰트 해금", "모든 기능 사용 가능"],
    nextUnlock: null,
  },
];

export function getTierByGenerations(totalGenerations: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalGenerations >= TIERS[i].minGen) return TIERS[i];
  }
  return TIERS[0];
}

export function getCreatorTier(totalGenerations: number): number {
  if (totalGenerations >= 30) return 3;
  if (totalGenerations >= 15) return 2;
  if (totalGenerations >= 5) return 1;
  return 0;
}

export const FEATURE_TIER_REQUIREMENTS = {
  pose: { minTier: 2, label: "포즈 생성", unlockAt: "인기 작가 (15회+)" },
  background: { minTier: 2, label: "배경/아이템 합성", unlockAt: "인기 작가 (15회+)" },
  effects: { minTier: 1, label: "블러 효과", unlockAt: "신인 작가 (5회+)" },
  bubbleEditor: { minTier: 1, label: "말풍선 에디터", unlockAt: "신인 작가 (5회+)" },
  allFonts: { minTier: 3, label: "전체 폰트", unlockAt: "프로 연재러 (30회+)" },
  chat: { minTier: -1, label: "채팅 이미지", unlockAt: "Pro 멤버십" },
  adMatch: { minTier: -1, label: "광고 매칭 AI", unlockAt: "Pro 멤버십" },
} as const;

export type FeatureKey = keyof typeof FEATURE_TIER_REQUIREMENTS;

export function canAccessFeature(featureKey: FeatureKey, creatorTier: number, isPro: boolean): boolean {
  const req = FEATURE_TIER_REQUIREMENTS[featureKey];
  if (req.minTier === -1) return isPro;
  if (isPro) return true;
  return creatorTier >= req.minTier;
}
