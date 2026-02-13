import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2,
  ArrowRight,
  Sparkles,
  Zap,
  MessageCircle,
  Target,
  Paintbrush,
  TrendingUp,
  Heart,
  ExternalLink,
  PenTool,
  Image,
  Trophy,
  Medal,
  Star,
  ChevronRight,
  Layers,
  Info,
  BookOpen,
  FileText,
  Eye,
  Trees,
  Briefcase,
  Check,
  Lock,
  Gift,
} from "lucide-react";
import type { Generation, TrendingAccount } from "@shared/schema";

interface UsageData {
  credits: number;
  tier: string;
  authorName: string | null;
  genre: string | null;
  totalGenerations: number;
  creatorTier: number;
  dailyFreeCredits: number;
  maxStoryPanels: number;
}

const GENRES = [
  { value: "daily", label: "일상", desc: "일상 이야기" },
  { value: "gag", label: "개그", desc: "코미디" },
  { value: "romance", label: "로맨스", desc: "사랑 이야기" },
  { value: "fantasy", label: "판타지", desc: "판타지 세계" },
] as const;

const TIERS = [
  {
    name: "입문 작가", icon: PenTool, minGen: 0, maxGen: 4, color: "text-muted-foreground", badge: "시작",
    dailyCredits: 3, maxPanels: 3,
    benefits: ["하루 3회 무료 생성", "3가지 스타일 사용", "포즈 & 배경 생성", "말풍선 편집기 (매일 3회)"],
    nextUnlock: "스토리 패널 5개 + 말풍선 에디터",
  },
  {
    name: "신인 작가", icon: Paintbrush, minGen: 5, maxGen: 14, color: "text-blue-500 dark:text-blue-400", badge: "5회+",
    dailyCredits: 3, maxPanels: 5,
    benefits: ["하루 3회 무료 생성", "스토리 패널 5개", "블러 효과 사용", "말풍선 에디터"],
    nextUnlock: "스토리 패널 8개",
  },
  {
    name: "인기 작가", icon: Star, minGen: 15, maxGen: 29, color: "text-amber-500 dark:text-amber-400", badge: "15회+",
    dailyCredits: 3, maxPanels: 8,
    benefits: ["하루 3회 무료 생성", "스토리 패널 8개", "포즈 & 배경 생성", "말풍선 에디터"],
    nextUnlock: "스토리 패널 10개 + 전체 폰트 해금",
  },
  {
    name: "프로 연재러", icon: Trophy, minGen: 30, maxGen: Infinity, color: "text-primary", badge: "30회+",
    dailyCredits: 3, maxPanels: 10,
    benefits: ["하루 3회 무료 생성", "스토리 패널 10개", "전체 폰트 해금", "모든 기능 사용 가능"],
    nextUnlock: null,
  },
];

function getTier(totalGenerations: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalGenerations >= TIERS[i].minGen) return { ...TIERS[i], index: i };
  }
  return { ...TIERS[0], index: 0 };
}

function getXpProgress(totalGenerations: number) {
  const tier = getTier(totalGenerations);
  if (tier.index >= TIERS.length - 1) return { progress: 100, remaining: 0, nextTier: null };
  const nextTier = TIERS[tier.index + 1];
  const progressInTier = totalGenerations - tier.minGen;
  const tierRange = nextTier.minGen - tier.minGen;
  const remaining = nextTier.minGen - totalGenerations;
  return {
    progress: Math.min(100, (progressInTier / tierRange) * 100),
    remaining,
    nextTier: nextTier.name,
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

const GENRE_CATEGORY_MAP: Record<string, string[]> = {
  daily: ["일상", "라이프", "에세이", "일상툰"],
  gag: ["개그", "코미디", "유머", "병맛"],
  romance: ["로맨스", "연애", "감성", "사랑"],
  fantasy: ["판타지", "판타지/SF", "액션", "모험"],
};

function OnboardingSurvey({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [genre, setGenre] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { authorName: string; genre: string }) => {
      await apiRequest("POST", "/api/creator-profile", data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["/api/usage"], (old: any) => ({
        ...old,
        authorName: variables.authorName,
        genre: variables.genre,
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      onComplete();
    },
    onError: () => {
      toast({ title: "오류", description: "프로필 저장에 실패했습니다", variant: "destructive" });
    },
  });

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="w-full max-w-md p-8 space-y-6" data-testid="card-onboarding-welcome">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Instatoon Maker</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI 인스타툰 캐릭터 자동화 서비스에 오신 걸 환영해요.<br/>
              먼저 간단한 프로필을 설정할게요.
            </p>
          </div>
          <Button className="w-full" onClick={() => setStep(1)} data-testid="button-onboarding-start">
            시작하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="w-full max-w-md p-8 space-y-6" data-testid="card-onboarding-name">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">STEP 1/2</p>
            <h2 className="text-xl font-bold">작가명을 알려주세요</h2>
            <p className="text-sm text-muted-foreground">
              크리에이터 프로필에 표시될 이름이에요.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorName">작가명</Label>
            <Input
              id="authorName"
              placeholder="예: 그림쟁이, 만화맨"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={30}
              data-testid="input-author-name"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => setStep(2)}
            disabled={!authorName.trim()}
            data-testid="button-onboarding-next"
          >
            다음 <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md p-8 space-y-6" data-testid="card-onboarding-genre">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">STEP 2/2</p>
          <h2 className="text-xl font-bold">주력 장르를 선택하세요</h2>
          <p className="text-sm text-muted-foreground">
            맞춤 트렌드 랭킹을 보여드릴게요.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GENRES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                genre === g.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover-elevate"
              }`}
              data-testid={`button-genre-${g.value}`}
            >
              <div className="font-semibold text-sm">{g.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{g.desc}</div>
            </button>
          ))}
        </div>
        <Button
          className="w-full"
          onClick={() => mutation.mutate({ authorName: authorName.trim(), genre })}
          disabled={!genre || mutation.isPending}
          data-testid="button-onboarding-complete"
        >
          {mutation.isPending ? "저장 중..." : "완료"}
        </Button>
      </Card>
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700 dark:text-amber-600" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function TrendingRow({ account }: { account: TrendingAccount }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover-elevate"
      data-testid={`row-trending-${account.rankType}-${account.rank}`}
    >
      <RankMedal rank={account.rank} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{account.displayName}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0">{account.category}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">@{account.handle}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(account.followers)}
          </span>
        </div>
      </div>
      <a
        href={`https://instagram.com/${account.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        data-testid={`link-instagram-${account.handle}`}
      >
        <Button variant="ghost" size="icon" data-testid={`button-instagram-${account.handle}`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </a>
    </div>
  );
}

const TOOL_SECTIONS = [
  {
    label: "캐릭터 만들기",
    items: [
      { href: "/create", icon: Wand2, title: "캐릭터 생성", desc: "텍스트로 AI 캐릭터 만들기", testId: "card-tool-create", gradient: "from-violet-500 to-purple-600", lightGradient: "from-violet-50 to-purple-50 dark:from-violet-500 dark:to-purple-600" },
      { href: "/pose", icon: Layers, title: "포즈 / 표정", desc: "다양한 포즈 & 표정 생성", testId: "card-tool-pose", gradient: "from-blue-500 to-indigo-600", lightGradient: "from-blue-50 to-indigo-50 dark:from-blue-500 dark:to-indigo-600" },
      { href: "/background", icon: Trees, title: "배경 / 아이템", desc: "배경과 소품 추가", testId: "card-tool-background", gradient: "from-emerald-500 to-teal-600", lightGradient: "from-emerald-50 to-teal-50 dark:from-emerald-500 dark:to-teal-600" },
    ],
  },
  {
    label: "편집 도구",
    items: [
      { href: "/story", icon: BookOpen, title: "스토리 에디터", desc: "멀티패널 인스타툰 제작", testId: "card-tool-story", gradient: "from-indigo-500 to-blue-600", lightGradient: "from-indigo-50 to-blue-50 dark:from-indigo-500 dark:to-blue-600" },
      { href: "/bubble", icon: Paintbrush, title: "말풍선 편집", desc: "손글씨 폰트 말풍선 추가", testId: "card-tool-bubble", gradient: "from-pink-500 to-rose-600", lightGradient: "from-pink-50 to-rose-50 dark:from-pink-500 dark:to-rose-600" },
      { href: "/effects", icon: Eye, title: "블러 효과", desc: "가우시안 / 모션 / 방사형", testId: "card-tool-effects", gradient: "from-cyan-500 to-sky-600", lightGradient: "from-cyan-50 to-sky-50 dark:from-cyan-500 dark:to-sky-600" },
      { href: "/chat", icon: MessageCircle, title: "채팅 이미지", desc: "카카오톡 스타일 채팅", testId: "card-tool-chat", pro: true, gradient: "from-amber-500 to-orange-600", lightGradient: "from-amber-50 to-orange-50 dark:from-amber-500 dark:to-orange-600" },
    ],
  },
  {
    label: "비즈니스",
    items: [
      { href: "/ad-match", icon: Target, title: "광고주 매칭", desc: "AI 맞춤 광고주 추천", testId: "card-tool-admatch", pro: true, gradient: "from-rose-500 to-red-600", lightGradient: "from-rose-50 to-red-50 dark:from-rose-500 dark:to-red-600" },
      { href: "/media-kit", icon: FileText, title: "미디어킷", desc: "PPT 스타일 포트폴리오", testId: "card-tool-mediakit", gradient: "from-orange-500 to-amber-600", lightGradient: "from-orange-50 to-amber-50 dark:from-orange-500 dark:to-amber-600" },
    ],
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });
  const { data: recentGenerations } = useQuery<Generation[]>({
    queryKey: ["/api/gallery"],
  });
  const { data: trending } = useQuery<{
    latest: TrendingAccount[];
    mostViewed: TrendingAccount[];
    realtime: TrendingAccount[];
  }>({
    queryKey: ["/api/trending"],
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTierGuide, setShowTierGuide] = useState(false);

  useEffect(() => {
    if (!usageLoading && usage && !usage.authorName && !usage.genre) {
      setShowOnboarding(true);
    }
  }, [usage, usageLoading]);

  const totalGen = usage?.totalGenerations || 0;
  const tier = getTier(totalGen);
  const xp = getXpProgress(totalGen);
  const TierIcon = tier.icon;

  const userGenre = usage?.genre;
  const genreLabel = GENRES.find(g => g.value === userGenre)?.label;

  const personalizedRanking = (() => {
    if (!trending || !userGenre) return trending?.realtime?.slice(0, 3) || [];
    const matchCategories = GENRE_CATEGORY_MAP[userGenre] || [];
    const allAccounts = [
      ...(trending.realtime || []),
      ...(trending.latest || []),
      ...(trending.mostViewed || []),
    ];
    const matched = allAccounts.filter(a =>
      matchCategories.some(cat =>
        a.category.includes(cat) || cat.includes(a.category)
      )
    );
    const unique = Array.from(new Map(matched.map(a => [a.handle, a])).values());
    if (unique.length > 0) return unique.slice(0, 3);
    return (trending.realtime || []).slice(0, 3);
  })();

  const recent = recentGenerations?.slice(0, 4) || [];

  return (
    <>
      {showOnboarding && (
        <OnboardingSurvey onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="mx-auto max-w-5xl px-6 py-8 pb-20 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
              {usage?.authorName || user?.firstName || "Creator"}님, 안녕하세요
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              오늘도 멋진 인스타툰을 만들어볼까요?
            </p>
          </div>
          <Link href="/pricing">
            <Avatar className="h-10 w-10 cursor-pointer" data-testid="avatar-profile">
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {(usage?.authorName || user?.firstName || "C").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6" data-testid="card-creator-studio">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${tier.color}`}>
                    <TierIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-lg" data-testid="text-tier-name">{tier.name}</h2>
                      {genreLabel && (
                        <Badge variant="secondary" className="text-[11px]" data-testid="badge-genre">{genreLabel}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      총 {totalGen}개 작품 생성
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {usage?.tier === "pro" ? (
                      <Badge variant="default" className="text-[11px]" data-testid="badge-plan">Pro</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px]" data-testid="badge-plan">Free</Badge>
                    )}
                    <span className="text-xs text-muted-foreground" data-testid="text-credits">
                      {usage?.tier === "pro" ? "무제한" : `${usage?.credits ?? 0}/${tier.dailyCredits}회`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">경험치</span>
                  <span className="text-xs font-medium tabular-nums" data-testid="text-xp-progress">
                    {xp.nextTier ? `${Math.round(xp.progress)}%` : "MAX"}
                  </span>
                </div>
                <Progress value={xp.progress} className="h-2" data-testid="progress-xp" />
                <p className="text-xs text-muted-foreground" data-testid="text-xp-hint">
                  {xp.nextTier && xp.remaining > 0 ? (
                    <><span className="font-medium text-primary">{xp.nextTier}</span>까지 {xp.remaining}개 더 생성하면 혜택 업그레이드</>
                  ) : (
                    <span className="font-medium text-primary">최고 등급 달성</span>
                  )}
                </p>
              </div>

              {tier.nextUnlock && (
                <div className="flex items-start gap-2.5 mt-3 rounded-lg bg-primary/5 p-3" data-testid="section-next-unlock">
                  <Gift className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-0.5">다음 등급 혜택</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tier.nextUnlock}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowTierGuide((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover-elevate rounded-md px-2 py-1.5 -mx-1 w-fit mt-3"
                data-testid="button-tier-guide-toggle"
              >
                <Info className="h-3.5 w-3.5" />
                <span>등급별 혜택 보기</span>
              </button>

              {showTierGuide && (
                <div className="space-y-3 pt-2" data-testid="section-tier-guide">
                  {TIERS.map((t, i) => {
                    const Icon = t.icon;
                    const isCurrent = tier.index === i;
                    const isUnlocked = tier.index >= i;
                    return (
                      <div
                        key={t.name}
                        className={`rounded-lg border p-3 text-xs transition-colors ${isCurrent ? "border-primary/30 bg-primary/5" : isUnlocked ? "border-border" : "border-border opacity-60"}`}
                        data-testid={`tier-info-${i}`}
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ${t.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className="font-semibold">{t.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{t.badge}</Badge>
                            {isCurrent && <Badge variant="default" className="text-[10px]">현재</Badge>}
                            {isUnlocked && !isCurrent && <Check className="h-3.5 w-3.5 text-green-500" />}
                            {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-[42px]">
                          {t.benefits.map((b, bi) => (
                            <div key={bi} className="flex items-center gap-1.5">
                              {isUnlocked ? (
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                              ) : (
                                <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                              )}
                              <span className={isUnlocked ? "" : "text-muted-foreground"}>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg font-bold">최근 작품</h2>
                  <Link href="/gallery">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid="button-view-all-gallery">
                      전체보기 <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recent.map((gen) => (
                    <Card key={gen.id} className="overflow-visible hover-elevate" data-testid={`card-recent-${gen.id}`}>
                      <div className="aspect-square overflow-hidden rounded-t-[calc(var(--radius)-1px)]">
                        <img
                          src={gen.resultImageUrl}
                          alt={gen.prompt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs truncate text-muted-foreground">{gen.prompt}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-5" data-testid="card-ranking">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight" data-testid="text-ranking-title">
                    {genreLabel ? `${genreLabel} 인기 크리에이터` : "인기 크리에이터"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {genreLabel ? `${genreLabel} 장르 맞춤 랭킹` : "지금 가장 인기 있는 작가"}
                  </p>
                </div>
              </div>
              {personalizedRanking.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  아직 랭킹 데이터가 없어요
                </p>
              ) : (
                <div className="space-y-0.5">
                  {personalizedRanking.map((account, idx) => (
                    <TrendingRow key={account.handle} account={{ ...account, rank: idx + 1 }} />
                  ))}
                </div>
              )}
            </Card>

            {usage?.tier !== "pro" && (
              <Link href="/pricing">
                <Card
                  className="p-5 hover-elevate cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20"
                  data-testid="card-upgrade-cta"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Pro로 업그레이드</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">무제한 생성 & 모든 기능 해제</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                  </div>
                </Card>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {TOOL_SECTIONS.map((section) => (
            <div key={section.label}>
              <h2 className="text-lg font-bold mb-4" data-testid={`text-section-${section.label}`}>{section.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {section.items.map((tool) => (
                  <Link key={tool.testId} href={tool.href}>
                    <div
                      className="group relative cursor-pointer h-full"
                      data-testid={tool.testId}
                    >
                      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${tool.lightGradient} p-5 h-full transition-all duration-200 group-hover:scale-[1.02] group-active:scale-[0.98] border border-black/[0.04] dark:border-white/[0.08]`}>
                        <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${tool.gradient} opacity-[0.08] dark:opacity-20 blur-xl transition-all duration-300 group-hover:opacity-[0.15] dark:group-hover:opacity-30 group-hover:scale-125`} />
                        <div className="relative flex flex-col gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} shadow-sm`}>
                            <tool.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-semibold text-sm dark:text-white">{tool.title}</h3>
                              {"pro" in tool && tool.pro && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white">PRO</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-white/60 mt-1 leading-relaxed">{tool.desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
