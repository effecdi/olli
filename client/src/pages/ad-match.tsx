import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Target, TrendingUp, Loader2, Lock, ArrowRight, CheckCircle2, Minus, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder,
  "data-testid": testId,
}: {
  value: string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  "data-testid"?: string;
}) {
  const numVal = parseFloat(value) || 0;

  const decrement = () => {
    const next = Math.max(min, numVal - step);
    onChange(step % 1 !== 0 ? next.toFixed(1) : String(next));
  };

  const increment = () => {
    const next = Math.min(max, numVal + step);
    onChange(step % 1 !== 0 ? next.toFixed(1) : String(next));
  };

  return (
    <div className="flex items-center gap-0">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-r-none shrink-0"
        onClick={decrement}
        disabled={numVal <= min}
        data-testid={testId ? `${testId}-dec` : undefined}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        data-testid={testId}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-l-none shrink-0"
        onClick={increment}
        disabled={numVal >= max}
        data-testid={testId ? `${testId}-inc` : undefined}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

const genres = [
  "로맨스", "일상", "개그", "판타지", "드라마", "스릴러",
  "호러", "BL/GL", "직장", "학원", "육아", "음식"
];

const ageGroups = [
  "10대", "20대 초반", "20대 후반", "30대", "40대+", "전연령"
];

const contentStyles = [
  "감성적", "유머러스", "현실적", "판타지", "교육적", "힐링"
];

interface AdRecommendation {
  category: string;
  brands: string[];
  matchScore: number;
  reason: string;
  expectedCPM: string;
}

interface AdMatchResult {
  recommendations: AdRecommendation[];
  insights: string;
}

export default function AdMatchPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: credits } = useQuery<{ credits: number; tier: string }>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const [formData, setFormData] = useState({
    genre: "",
    followers: "",
    ageGroup: "",
    contentStyle: "",
    postFrequency: "",
    engagement: "",
  });
  const [results, setResults] = useState<AdMatchResult | null>(null);

  const isPro = credits?.tier === "pro";
  const [limitOpen, setLimitOpen] = useState(false);

  const getDailyKey = (feature: string) => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `daily_${feature}_${y}${m}${day}`;
  };

  const getDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const raw = localStorage.getItem(key);
    return raw ? parseInt(raw) || 0 : 0;
  };

  const incDailyCount = (feature: string) => {
    const key = getDailyKey(feature);
    const current = getDailyCount(feature);
    localStorage.setItem(key, String(current + 1));
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/ad-match", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error: any) => {
      toast({
        title: "분석 실패",
        description: error.message || "광고주 매칭 분석에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const used = getDailyCount("admatch");
    if (used >= 3) {
      setLimitOpen(true);
      return;
    }
    incDailyCount("admatch");
    mutation.mutate(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4 px-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold" data-testid="text-login-required">로그인이 필요합니다</h2>
        <Button asChild data-testid="button-login-admatch">
          <a href="/login">로그인</a>
        </Button>
      </div>
    );
  }

  // Pro 가드 제거: 모든 사용자 사용 가능

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용 제한 안내</DialogTitle>
            <DialogDescription>3회이상 사용이 제한됐어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setLimitOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight" data-testid="text-admatch-title">
            AI 광고주 매칭
          </h1>
        </div>
        <p className="text-muted-foreground ml-[52px]">
          AI가 내 인스타툰 프로필을 분석해서 딱 맞는 광고주를 추천해줍니다
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="p-6" data-testid="card-admatch-form">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            내 인스타툰 프로필
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>장르</Label>
              <Select value={formData.genre} onValueChange={(v) => setFormData({ ...formData, genre: v })}>
                <SelectTrigger data-testid="select-genre">
                  <SelectValue placeholder="장르 선택" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>팔로워 수</Label>
              <NumberStepper
                value={formData.followers}
                onChange={(v) => setFormData({ ...formData, followers: v })}
                min={0}
                max={10000000}
                step={1000}
                placeholder="예: 15000"
                data-testid="input-followers"
              />
            </div>

            <div>
              <Label>타겟 연령대</Label>
              <Select value={formData.ageGroup} onValueChange={(v) => setFormData({ ...formData, ageGroup: v })}>
                <SelectTrigger data-testid="select-age-group">
                  <SelectValue placeholder="연령대 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>콘텐츠 스타일</Label>
              <Select value={formData.contentStyle} onValueChange={(v) => setFormData({ ...formData, contentStyle: v })}>
                <SelectTrigger data-testid="select-content-style">
                  <SelectValue placeholder="스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  {contentStyles.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>주간 포스팅 횟수</Label>
              <NumberStepper
                value={formData.postFrequency}
                onChange={(v) => setFormData({ ...formData, postFrequency: v })}
                min={1}
                max={14}
                step={1}
                placeholder="주당 포스팅 수"
                data-testid="input-post-frequency"
              />
            </div>

            <div>
              <Label>평균 참여율 (%)</Label>
              <NumberStepper
                value={formData.engagement}
                onChange={(v) => setFormData({ ...formData, engagement: v })}
                min={0}
                max={100}
                step={0.1}
                placeholder="예: 5.5"
                data-testid="input-engagement"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={mutation.isPending || !formData.genre || !formData.followers || !formData.ageGroup || !formData.contentStyle || !formData.postFrequency || !formData.engagement}
              data-testid="button-analyze"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI 추천 받기
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {mutation.isPending && (
            <Card className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4 animate-pulse">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI가 분석 중입니다...</h3>
              <p className="text-muted-foreground text-sm">내 인스타툰에 가장 적합한 광고주를 찾고 있어요</p>
            </Card>
          )}

          {results && (
            <div className="space-y-4" data-testid="results-container">
              <Card className="p-6 bg-primary text-primary-foreground">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">AI 인사이트</h3>
                    <p className="text-sm opacity-90" data-testid="text-insights">{results.insights}</p>
                  </div>
                </div>
              </Card>

              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(173_100%_35%)]" />
                추천 광고주
              </h3>

              {results.recommendations.map((rec, idx) => (
                <Card key={idx} className="p-5" data-testid={`card-recommendation-${idx}`}>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-semibold">{rec.category}</h4>
                    <Badge variant="secondary" className="text-xs">
                      매칭 {rec.matchScore}%
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {rec.brands.map((brand) => (
                      <Badge key={brand} variant="outline" className="text-xs">{brand}</Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    예상 CPM: <span className="font-medium">{rec.expectedCPM}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!mutation.isPending && !results && (
            <Card className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">프로필을 입력하세요</h3>
              <p className="text-sm text-muted-foreground">
                인스타툰 정보를 입력하면 AI가 최적의 광고주를 추천해드립니다
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
