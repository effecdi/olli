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
          <LiquidGlass
            key={plan.name}
            displacementScale={plan.highlighted ? 80 : 60}
            blurAmount={0.08}
            saturation={plan.highlighted ? 145 : 125}
            elasticity={plan.highlighted ? 0.26 : 0.18}
            cornerRadius={24}
            padding="0"
            className="h-full"
            overLight={false}
          >
            <Card
              className={`h-full p-6 flex flex-col relative rounded-3xl border-0 ${
                plan.highlighted
                  ? "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-500 text-white shadow-[0_22px_70px_rgba(129,140,248,0.6)]"
                  : "bg-slate-950/80 text-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.85)]"
              }`}
              data-testid={`card-plan-${plan.tier}`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white/15 border border-white/30 text-[11px]">
                  추천
                </Badge>
              )}
              <div className="relative mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      plan.highlighted ? "bg-white/20" : "bg-slate-800/80"
                    }`}
                  >
                    <plan.icon className={`h-5 w-5 ${plan.highlighted ? "text-white" : "text-teal-300"}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? "text-white/80" : "text-slate-300"}>{plan.period}</span>
                </div>
                <p className={plan.highlighted ? "mt-2 text-sm text-white/85" : "mt-2 text-sm text-slate-300"}>
                  {plan.description}
                </p>
              </div>

              <ul className="relative flex-1 space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? "text-lime-300" : "text-teal-300"
                        }`}
                      />
                    ) : (
                      <X
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? "text-white/25" : "text-slate-500/60"
                        }`}
                      />
                    )}
                    <span
                      className={
                        feature.included
                          ? plan.highlighted
                            ? "text-white/95"
                            : "text-slate-100"
                          : plan.highlighted
                            ? "text-white/50"
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
                className={`w-full gap-2 h-11 rounded-full ${
                  plan.highlighted
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : "border-slate-400/80 text-slate-50 bg-slate-900/20 hover:bg-slate-900/60"
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
            </Card>
          </LiquidGlass>
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
