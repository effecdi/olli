import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { TIERS, FEATURE_TIER_REQUIREMENTS, type FeatureKey } from "@/lib/tier";

interface TierLockScreenProps {
  featureKey: FeatureKey;
  currentTier: number;
  totalGenerations: number;
}

export function TierLockScreen({ featureKey, currentTier, totalGenerations }: TierLockScreenProps) {
  const req = FEATURE_TIER_REQUIREMENTS[featureKey];
  const targetTier = req.minTier >= 0 && req.minTier < TIERS.length ? TIERS[req.minTier] : null;
  const remaining = targetTier ? Math.max(0, targetTier.minGen - totalGenerations) : 0;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center" data-testid={`tier-lock-${featureKey}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-6">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold mb-2">{req.label} 잠김</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        이 기능은 <span className="font-semibold text-foreground">{req.unlockAt}</span> 등급부터 사용할 수 있어요.
        {remaining > 0 && (
          <>
            <br />
            캐릭터를 <span className="font-semibold text-foreground">{remaining}회</span> 더 생성하면 해금됩니다.
          </>
        )}
      </p>
      <div className="flex flex-col gap-3 items-center">
        <Link href="/create">
          <Button className="gap-2" data-testid="button-go-create-unlock">
            <Sparkles className="h-4 w-4" />
            캐릭터 만들어서 해금하기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          현재 등급: {TIERS[currentTier]?.name ?? "입문 작가"} ({totalGenerations}회 생성)
        </p>
      </div>
    </div>
  );
}
