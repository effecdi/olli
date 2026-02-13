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
      description: "OLLI를 체험해보세요",
      icon: Sparkles,
      features: [
        { text: "매일 3회 캐릭터 생성", included: true },
        { text: "3가지 스타일 (심플 라인 / 미니멀 / 낙서풍)", included: true },
        { text: "포즈 & 배경 생성", included: true },
        { text: "말풍선 편집기 (매일 3회)", included: true },
        { text: "스토리 에디터 (매일 3회)", included: true },
        { text: "갤러리 이용", included: true },
        { text: "3가지 프리미엄 스타일 추가", included: false },
        { text: "채팅 이미지 메이커", included: false },
        { text: "AI 광고주 매칭", included: false },
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
        { text: "6가지 전체 스타일 사용", included: true },
        { text: "포즈 & 배경 무제한 생성", included: true },
        { text: "말풍선 편집기 무제한", included: true },
        { text: "스토리 에디터 무제한", included: true },
        { text: "채팅 이미지 메이커", included: true },
        { text: "AI 광고주 매칭", included: true },
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
            className={`p-6 flex flex-col relative ${plan.highlighted ? "border-primary" : ""}`}
            data-testid={`card-plan-${plan.tier}`}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">추천</Badge>
            )}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="flex-1 space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "" : "text-muted-foreground/60"}>{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.tier === "pro" ? "default" : "secondary"}
              className="w-full gap-2"
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
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>무료 플랜은 매일 자정(UTC)에 사용 횟수가 초기화됩니다.</p>
        <p className="mt-1">Pro 멤버십은 채팅 이미지 메이커, AI 광고주 매칭을 포함합니다.</p>
      </div>
    </div>
  );
}
