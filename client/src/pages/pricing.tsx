import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, Sparkles, Zap, X, Loader2 } from "lucide-react";
import { useState } from "react";
import LiquidGlass from "liquid-glass-react";

declare global {
  interface Window {
    IMP?: {
      init: (merchantId: string) => void;
      request_pay: (params: any, callback: (response: any) => void) => void;
    };
  }
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: credits } = useQuery<{ credits: number; tier: string }>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!document.getElementById("iamport-sdk")) {
      const script = document.createElement("script");
      script.id = "iamport-sdk";
      script.src = "https://cdn.iamport.kr/v1/iamport.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handlePayment = useCallback(async (productType: "pro" | "credits") => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (!window.IMP) {
      toast({ title: "결제 모듈 로딩 중", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      return;
    }

    const merchantUid = `${productType}_${Date.now()}`;
    const amount = productType === "pro" ? 19900 : 4900;
    const name = productType === "pro" ? "OLLI Pro 멤버십 (월간)" : "OLLI 크레딧 50개";

    window.IMP.init(import.meta.env.VITE_PORTONE_MERCHANT_ID || "imp00000000");

    setIsProcessing(true);

    window.IMP.request_pay(
      {
        pg: "kakaopay",
        pay_method: "card",
        merchant_uid: merchantUid,
        name,
        amount,
        buyer_email: user?.email || "",
        buyer_name: user?.firstName || "",
      },
      async (response: any) => {
        if (response.success) {
          try {
            const res = await apiRequest("POST", "/api/payment/complete", {
              imp_uid: response.imp_uid,
              merchant_uid: merchantUid,
              product_type: productType,
            });
            const data = await res.json();
            queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
            toast({
              title: "결제 완료!",
              description: productType === "pro"
                ? "Pro 멤버가 되었습니다!"
                : `${data.creditsAdded}개의 크레딧이 추가되었습니다.`,
            });
          } catch (error: any) {
            toast({ title: "결제 검증 실패", description: error.message || "관리자에게 문의하세요.", variant: "destructive" });
          }
        } else {
          toast({ title: "결제 취소", description: response.error_msg || "결제가 취소되었습니다.", variant: "destructive" });
        }
        setIsProcessing(false);
      }
    );
  }, [isAuthenticated, user, toast]);

  const plans = [
    {
      name: "무료",
      price: "₩0",
      period: "영구 무료",
      description: "첫 가입 후 3회까지 무료로 체험해보세요",
      icon: Sparkles,
      features: [
        { text: "첫 가입 후 3회 캐릭터 생성", included: true },
        { text: "3가지 스타일 (심플 라인)", included: true },
        { text: "기본 및 일부 무료 폰트 제공", included: true },
        { text: "포즈 & 배경 생성", included: false },
        { text: "말풍선 편집기", included: false },
        { text: "스토리 에디터", included: false },
        { text: "갤러리 조회만 가능", included: true },
        { text: "워터마크 포함", included: true },
        { text: "프리미엄 스타일", included: false },
        { text: "채팅 이미지 메이커", included: false },
        { text: "상업적 이용", included: false },
      ],
      tier: "free",
    },
    {
      name: "Pro",
      price: "₩19,900",
      period: "/월",
      description: "본격적인 크리에이터를 위한 플랜",
      icon: Zap,
      features: [
        { text: "무제한 캐릭터 생성", included: true },
        { text: "모든 스타일 사용 가능", included: true },
        { text: "모든 폰트 제공", included: true },
        { text: "포즈 & 배경 무제한 생성", included: true },
        { text: "말풍선 & 스토리 에디터 무제한", included: true },
        { text: "워터마크 제거", included: true },
        { text: "갤러리 전체 이용", included: true },
        { text: "상업적 이용 가능", included: true },
        { text: "우선 지원", included: true },
      ],
      tier: "pro",
      highlighted: true,
    },
  ];

  const getButtonText = (tier: string) => {
    if (!isAuthenticated) return "로그인";
    if (tier === "free") return credits?.tier === "free" ? "현재 플랜" : "무료 플랜";
    if (tier === "pro") return credits?.tier === "pro" ? "현재 플랜" : "Pro 업그레이드";
    return "";
  };

  const handlePlanAction = (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (tier === "pro" && credits?.tier !== "pro") {
      handlePayment("pro");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-pricing-title">
          심플하고 투명한 요금제
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          나에게 맞는 플랜을 선택하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative h-full overflow-hidden rounded-3xl border-0 px-8 py-9 shadow-[0_22px_70px_rgba(15,23,42,0.85)] ${
              plan.highlighted
                ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white"
                : "bg-slate-950 text-slate-50"
            }`}
            data-testid={`card-plan-${plan.tier}`}
          >
            <div
              className={
                plan.highlighted
                  ? "absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 mix-blend-screen"
                  : "absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900 to-black"
              }
            />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between mb-6">
                {plan.highlighted ? (
                  <>
                    <Badge className="bg-white/15 text-[11px] px-3 py-1 border border-white/20">Pro</Badge>
                    <span className="text-[11px] text-white/80">{plan.period}</span>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-sm uppercase tracking-[0.18em] text-slate-400">Free</h3>
                    <span className="text-[11px] text-slate-400">{plan.period}</span>
                  </>
                )}
              </div>
              <div className="mb-2">
                {plan.highlighted ? (
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70 mb-1">크리에이터 추천</p>
                ) : null}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  <span className={plan.highlighted ? "text-sm text-white/80" : "text-sm text-slate-400"}>/월</span>
                </div>
                <p
                  className={
                    plan.highlighted ? "mt-2 text-xs text-white/85" : "mt-2 text-xs text-slate-400"
                  }
                >
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 text-sm mb-7 mt-2">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2.5">
                    {feature.included ? (
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          plan.highlighted ? "text-white" : "text-teal-300"
                        }`}
                      />
                    ) : (
                      <X
                        className={`h-4 w-4 shrink-0 ${
                          plan.highlighted ? "text-white/25" : "text-slate-500/60"
                        }`}
                      />
                    )}
                    <span
                      className={
                        feature.included
                          ? plan.highlighted
                            ? "text-white/95"
                            : "text-slate-200"
                          : plan.highlighted
                            ? "text-white/55"
                            : "text-slate-400"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={`mt-auto w-full h-11 rounded-full ${
                  plan.highlighted
                    ? "bg-white text-slate-900 hover:bg-slate-100 border-0"
                    : "border-slate-500/70 text-slate-50 hover:bg-slate-900/60"
                }`}
                disabled={
                  (plan.tier === "free" && credits?.tier === "free") ||
                  (plan.tier === "pro" && credits?.tier === "pro") ||
                  isProcessing
                }
                onClick={() => handlePlanAction(plan.tier)}
                data-testid={`button-plan-${plan.tier}`}
              >
                {isProcessing && plan.tier === "pro" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {getButtonText(plan.tier)}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>무료 플랜은 첫 가입 후 캐릭터 생성 3회를 제공합니다.</p>
        <p className="mt-1">
          Pro 멤버십은 포즈/배경 생성, 말풍선·스토리 에디터, 채팅 이미지 메이커, AI 광고주 매칭 등을 포함합니다.
        </p>
      </div>
    </div>
  );
}
