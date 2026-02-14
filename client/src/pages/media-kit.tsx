import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ArrowRight, ArrowLeft, FileText, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import html2canvas from "html2canvas";
import { apiRequest } from "@/lib/queryClient";

interface MediaKitData {
  handle: string;
  profileName: string;
  category: string;
  bio: string;
  followers: string;
  following: string;
  avgLikes: string;
  avgComments: string;
  reach: string;
  engagement: string;
  ageGroup1: string;
  ageGroup2: string;
  ageGroup3: string;
  ageGroup4: string;
  genderMale: string;
  genderFemale: string;
  priceFeed: string;
  priceStory: string;
  priceReel: string;
  pricePackage: string;
  contactEmail: string;
  contactKakao: string;
}

const CATEGORIES = [
  "라이프스타일", "패션", "뷰티", "음식", "여행",
  "피트니스", "테크", "아트", "교육", "육아",
  "게임", "음악", "사진", "웹툰", "기타",
];

const SLIDE_COLORS = {
  primary: "#00B39E",
  secondary: "#18C4B0",
  accent: "#ec4899",
  bg: "#fafafe",
  text: "#0b1b1a",
  subtext: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
};

const PIE_COLORS = ["#00B39E", "#ec4899", "#f59e0b", "#10b981"];
const BAR_COLORS = ["#00B39E", "#18C4B0", "#40D6C8", "#78E8DE", "#AEEFE8"];

export default function MediaKitPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEnhancingBio, setIsEnhancingBio] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [data, setData] = useState<MediaKitData>({
    handle: "", profileName: "", category: "Lifestyle", bio: "",
    followers: "", following: "", avgLikes: "", avgComments: "",
    reach: "", engagement: "",
    ageGroup1: "35", ageGroup2: "30", ageGroup3: "20", ageGroup4: "15",
    genderMale: "35", genderFemale: "65",
    priceFeed: "", priceStory: "", priceReel: "", pricePackage: "",
    contactEmail: "", contactKakao: "",
  });

  const updateField = (field: keyof MediaKitData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const formatNum = (v: string) => {
    const n = parseInt(v);
    if (isNaN(n)) return v || "0";
    if (n >= 10000) return (n / 10000).toFixed(1) + "만";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  };

  const handleGenerate = () => {
    if (!data.handle || !data.profileName) {
      toast({ title: "필수 입력", description: "인스타그램 핸들과 프로필 이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    setShowPreview(true);
    setCurrentSlide(0);
  };

  const handleEnhanceBio = async () => {
    if (!data.bio || data.bio.trim().length < 3) {
      toast({ title: "내용을 먼저 작성해주세요", description: "AI가 다듬을 수 있도록 간단한 설명을 먼저 입력해주세요.", variant: "destructive" });
      return;
    }
    setIsEnhancingBio(true);
    try {
      const res = await apiRequest("POST", "/api/enhance-bio", {
        bio: data.bio,
        profileName: data.profileName,
        category: data.category,
        followers: data.followers,
        engagement: data.engagement,
      });
      const result = await res.json();
      updateField("bio", result.enhancedBio);
      toast({ title: "AI 작성 완료", description: "소개문이 전문적으로 다듬어졌습니다." });
    } catch (error: any) {
      toast({ title: "오류", description: error.message || "AI 작성에 실패했습니다.", variant: "destructive" });
    }
    setIsEnhancingBio(false);
  };

  const downloadAllSlides = async () => {
    setIsDownloading(true);
    try {
      for (let i = 0; i < 6; i++) {
        setCurrentSlide(i);
        await new Promise((r) => setTimeout(r, 300));
        const el = slideRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true });
        const link = document.createElement("a");
        link.download = `media-kit-slide-${i + 1}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
      toast({ title: "다운로드 완료!", description: "6개 슬라이드가 모두 저장되었습니다." });
    } catch {
      toast({ title: "오류", description: "슬라이드 다운로드에 실패했습니다.", variant: "destructive" });
    }
    setIsDownloading(false);
  };

  const downloadCurrentSlide = async () => {
    const el = slideRefs.current[currentSlide];
    if (!el) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement("a");
      link.download = `media-kit-slide-${currentSlide + 1}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast({ title: "오류", description: "슬라이드 다운로드에 실패했습니다.", variant: "destructive" });
    }
    setIsDownloading(false);
  };

  const ageData = [
    { name: "13-17", value: parseInt(data.ageGroup1) || 0 },
    { name: "18-24", value: parseInt(data.ageGroup2) || 0 },
    { name: "25-34", value: parseInt(data.ageGroup3) || 0 },
    { name: "35+", value: parseInt(data.ageGroup4) || 0 },
  ];

  const genderData = [
    { name: "남성", value: parseInt(data.genderMale) || 0 },
    { name: "여성", value: parseInt(data.genderFemale) || 0 },
  ];

  const engagementData = [
    { name: "좋아요", value: parseInt(data.avgLikes) || 0 },
    { name: "댓글", value: parseInt(data.avgComments) || 0 },
    { name: "도달", value: parseInt(data.reach) || 0 },
  ];

  const slideStyle: React.CSSProperties = {
    width: "720px",
    height: "540px",
    fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
    overflow: "hidden",
    position: "relative",
  };

  const slides = [
    <div
      key="slide-0"
      ref={(el) => { slideRefs.current[0] = el; }}
      style={{
        ...slideStyle,
        background: `linear-gradient(135deg, ${SLIDE_COLORS.primary} 0%, ${SLIDE_COLORS.secondary} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        padding: "48px",
      }}
      data-testid="slide-cover"
    >
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "3px solid rgba(255,255,255,0.5)" }}>
        <span style={{ fontSize: 40, fontWeight: 800 }}>{data.profileName?.[0]?.toUpperCase() || "?"}</span>
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>{data.profileName || "프로필 이름"}</h1>
      <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 4 }}>@{data.handle || "사용자명"}</p>
      <Badge className="mt-3 no-default-hover-elevate no-default-active-elevate" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, padding: "6px 16px" }}>{data.category}</Badge>
      <div style={{ position: "absolute", bottom: 32, fontSize: 13, opacity: 0.6 }}>MEDIA KIT {new Date().getFullYear()}</div>
    </div>,

    <div
      key="slide-1"
      ref={(el) => { slideRefs.current[1] = el; }}
      style={{
        ...slideStyle,
        background: SLIDE_COLORS.bg,
        padding: "40px 48px",
        display: "flex",
        flexDirection: "column",
      }}
      data-testid="slide-about"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: SLIDE_COLORS.primary, borderRadius: 2 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: SLIDE_COLORS.text }}>소개</h2>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: SLIDE_COLORS.subtext, flex: 1, whiteSpace: "pre-wrap" }}>
        {data.bio || "자기 소개를 입력하세요..."}
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        {data.contactEmail && (
          <div style={{ background: SLIDE_COLORS.card, border: `1px solid ${SLIDE_COLORS.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: SLIDE_COLORS.subtext }}>
            {data.contactEmail}
          </div>
        )}
        {data.contactKakao && (
          <div style={{ background: SLIDE_COLORS.card, border: `1px solid ${SLIDE_COLORS.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: SLIDE_COLORS.subtext }}>
            KakaoTalk: {data.contactKakao}
          </div>
        )}
      </div>
    </div>,

    <div
      key="slide-2"
      ref={(el) => { slideRefs.current[2] = el; }}
      style={{
        ...slideStyle,
        background: SLIDE_COLORS.bg,
        padding: "40px 48px",
      }}
      data-testid="slide-metrics"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <div style={{ width: 4, height: 28, background: SLIDE_COLORS.primary, borderRadius: 2 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: SLIDE_COLORS.text }}>주요 지표</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {[
          { label: "팔로워", value: formatNum(data.followers) },
          { label: "팔로잉", value: formatNum(data.following) },
          { label: "평균 좋아요", value: formatNum(data.avgLikes) },
          { label: "평균 댓글", value: formatNum(data.avgComments) },
          { label: "월간 도달", value: formatNum(data.reach) },
          { label: "참여율", value: data.engagement ? `${data.engagement}%` : "0%" },
        ].map((m, i) => (
          <div key={i} style={{
            background: SLIDE_COLORS.card,
            border: `1px solid ${SLIDE_COLORS.border}`,
            borderRadius: 12,
            padding: "20px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: SLIDE_COLORS.primary, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: SLIDE_COLORS.subtext, textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>,

    <div
      key="slide-3"
      ref={(el) => { slideRefs.current[3] = el; }}
      style={{
        ...slideStyle,
        background: SLIDE_COLORS.bg,
        padding: "40px 48px",
      }}
      data-testid="slide-audience"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: SLIDE_COLORS.primary, borderRadius: 2 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: SLIDE_COLORS.text }}>오디언스 분석</h2>
      </div>
      <div style={{ display: "flex", gap: 24, height: 340 }}>
        <div style={{ flex: 1, background: SLIDE_COLORS.card, border: `1px solid ${SLIDE_COLORS.border}`, borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: SLIDE_COLORS.text, marginBottom: 8 }}>연령 분포</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLIDE_COLORS.subtext }} />
              <YAxis tick={{ fontSize: 11, fill: SLIDE_COLORS.subtext }} unit="%" />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {ageData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: SLIDE_COLORS.card, border: `1px solid ${SLIDE_COLORS.border}`, borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: SLIDE_COLORS.text, marginBottom: 8 }}>성별 비율</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                <Cell fill={SLIDE_COLORS.primary} />
                <Cell fill={SLIDE_COLORS.accent} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>,

    <div
      key="slide-4"
      ref={(el) => { slideRefs.current[4] = el; }}
      style={{
        ...slideStyle,
        background: SLIDE_COLORS.bg,
        padding: "40px 48px",
      }}
      data-testid="slide-engagement"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: SLIDE_COLORS.primary, borderRadius: 2 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: SLIDE_COLORS.text }}>인게이지먼트 개요</h2>
      </div>
      <div style={{ background: SLIDE_COLORS.card, border: `1px solid ${SLIDE_COLORS.border}`, borderRadius: 12, padding: "24px", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: SLIDE_COLORS.subtext }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: SLIDE_COLORS.text, fontWeight: 500 }} width={80} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36}>
              {engagementData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>,

    <div
      key="slide-5"
      ref={(el) => { slideRefs.current[5] = el; }}
      style={{
        ...slideStyle,
        background: `linear-gradient(135deg, ${SLIDE_COLORS.primary} 0%, ${SLIDE_COLORS.secondary} 100%)`,
        padding: "40px 48px",
        color: "#fff",
      }}
      data-testid="slide-pricing"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <div style={{ width: 4, height: 28, background: "rgba(255,255,255,0.5)", borderRadius: 2 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>광고 단가</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { label: "피드 게시물", price: data.priceFeed },
          { label: "스토리", price: data.priceStory },
          { label: "릴스", price: data.priceReel },
          { label: "패키지", price: data.pricePackage },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "24px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{item.price ? `${parseInt(item.price).toLocaleString()}원` : "-"}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 32, left: 48, right: 48, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7, fontSize: 13 }}>
        <span>@{data.handle || "username"}</span>
        <span>{data.contactEmail || ""}</span>
      </div>
    </div>,
  ];

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3" data-testid="text-login-required-mediakit">로그인이 필요합니다</h2>
        <p className="text-muted-foreground mb-6">미디어킷을 만들려면 로그인하세요.</p>
        <Button asChild data-testid="button-login-mediakit">
          <a href="/login" className="gap-2">로그인 <ArrowRight className="h-4 w-4" /></a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold tracking-tight" data-testid="text-mediakit-title">미디어킷</h1>
        <p className="mt-2 text-muted-foreground">광고주에게 보낼 미디어킷을 만들어보세요</p>
      </div>

      {!showPreview ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" data-testid="label-profile-section">프로필 정보</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">인스타그램 핸들</Label>
                  <Input value={data.handle} onChange={(e) => updateField("handle", e.target.value)} placeholder="@username" data-testid="input-handle" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">프로필 이름</Label>
                  <Input value={data.profileName} onChange={(e) => updateField("profileName", e.target.value)} placeholder="표시 이름" data-testid="input-profile-name" />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs mb-1 block">카테고리</Label>
                <Select value={data.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <Label className="text-xs">자기 소개</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceBio}
                    disabled={isEnhancingBio}
                    data-testid="button-ai-enhance-bio"
                  >
                    {isEnhancingBio ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isEnhancingBio ? "AI 작성 중..." : "AI 작성"}
                  </Button>
                </div>
                <Textarea value={data.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="간단한 설명을 입력하면 AI가 전문적으로 다듬어 드립니다..." rows={4} data-testid="input-bio" />
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" data-testid="label-contact-section">연락처</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">이메일</Label>
                  <Input value={data.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} placeholder="email@example.com" data-testid="input-contact-email" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">카카오톡 ID</Label>
                  <Input value={data.contactKakao} onChange={(e) => updateField("contactKakao", e.target.value)} placeholder="kakao_id" data-testid="input-contact-kakao" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" data-testid="label-metrics-section">지표 & 인사이트</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">팔로워</Label>
                  <Input type="number" value={data.followers} onChange={(e) => updateField("followers", e.target.value)} placeholder="10000" data-testid="input-followers" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">팔로잉</Label>
                  <Input type="number" value={data.following} onChange={(e) => updateField("following", e.target.value)} placeholder="500" data-testid="input-following" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">평균 좋아요</Label>
                  <Input type="number" value={data.avgLikes} onChange={(e) => updateField("avgLikes", e.target.value)} placeholder="500" data-testid="input-avg-likes" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">평균 댓글</Label>
                  <Input type="number" value={data.avgComments} onChange={(e) => updateField("avgComments", e.target.value)} placeholder="50" data-testid="input-avg-comments" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">월간 도달</Label>
                  <Input type="number" value={data.reach} onChange={(e) => updateField("reach", e.target.value)} placeholder="50000" data-testid="input-reach" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">참여율 (%)</Label>
                  <Input type="number" value={data.engagement} onChange={(e) => updateField("engagement", e.target.value)} placeholder="5.2" data-testid="input-engagement" />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs font-medium mb-2 block">연령 분포 (%)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "ageGroup1" as const, label: "13-17" },
                    { key: "ageGroup2" as const, label: "18-24" },
                    { key: "ageGroup3" as const, label: "25-34" },
                    { key: "ageGroup4" as const, label: "35+" },
                  ].map((ag) => (
                    <div key={ag.key}>
                      <Label className="text-xs text-muted-foreground mb-1 block">{ag.label}</Label>
                      <Input type="number" value={data[ag.key]} onChange={(e) => updateField(ag.key, e.target.value)} data-testid={`input-age-${ag.label}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs font-medium mb-2 block">성별 비율 (%)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">남성</Label>
                    <Input type="number" value={data.genderMale} onChange={(e) => updateField("genderMale", e.target.value)} data-testid="input-gender-male" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">여성</Label>
                    <Input type="number" value={data.genderFemale} onChange={(e) => updateField("genderFemale", e.target.value)} data-testid="input-gender-female" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" data-testid="label-pricing-section">광고 단가 (원)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">피드 게시물</Label>
                  <Input type="number" value={data.priceFeed} onChange={(e) => updateField("priceFeed", e.target.value)} placeholder="100000" data-testid="input-price-feed" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">스토리</Label>
                  <Input type="number" value={data.priceStory} onChange={(e) => updateField("priceStory", e.target.value)} placeholder="50000" data-testid="input-price-story" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">릴스</Label>
                  <Input type="number" value={data.priceReel} onChange={(e) => updateField("priceReel", e.target.value)} placeholder="200000" data-testid="input-price-reel" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">패키지</Label>
                  <Input type="number" value={data.pricePackage} onChange={(e) => updateField("pricePackage", e.target.value)} placeholder="300000" data-testid="input-price-package" />
                </div>
              </div>
            </Card>

            <Button size="lg" className="gap-2" onClick={handleGenerate} data-testid="button-generate-mediakit">
              <FileText className="h-4 w-4" />
              미디어킷 생성
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="gap-1" data-testid="button-back-edit">
              <ArrowLeft className="h-4 w-4" />
              수정
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                data-testid="button-prev-slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" data-testid="badge-slide-number">{currentSlide + 1} / 6</Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentSlide(Math.min(5, currentSlide + 1))}
                disabled={currentSlide === 5}
                data-testid="button-next-slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="gap-1" onClick={downloadCurrentSlide} disabled={isDownloading} data-testid="button-download-slide">
              <Download className="h-4 w-4" />
              이 슬라이드
            </Button>
            <Button className="gap-1" onClick={downloadAllSlides} disabled={isDownloading} data-testid="button-download-all">
              <Download className="h-4 w-4" />
              {isDownloading ? "다운로드 중..." : "모든 슬라이드"}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {["표지", "소개", "지표", "오디언스", "인게이지먼트", "단가"].map((name, i) => (
              <Button
                key={i}
                variant={currentSlide === i ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSlide(i)}
                data-testid={`button-slide-tab-${i}`}
              >
                {name}
              </Button>
            ))}
          </div>

          <div className="w-full overflow-x-auto">
            <Card className="overflow-hidden mx-auto" style={{ width: "fit-content" }}>
              <div style={{ position: "relative" }}>
                {slides.map((slide, i) => (
                  <div key={i} style={{ display: currentSlide === i ? "block" : "none" }}>
                    {slide}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
