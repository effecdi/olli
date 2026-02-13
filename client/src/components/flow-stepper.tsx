import { useLocation } from "wouter";
import { FLOW_STEPS, getStepByPath } from "@/lib/flow";
import { Check } from "lucide-react";

export function FlowStepper({ currentStep }: { currentStep?: number }) {
  const [location] = useLocation();
  const step = currentStep ?? getStepByPath(location);

  return (
    <div className="flex items-center gap-1 py-3 px-2" data-testid="flow-stepper">
      {FLOW_STEPS.map((s, i) => {
        const isActive = s.step === step;
        const isDone = s.step < step;
        return (
          <div key={s.step} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`w-4 sm:w-6 h-px ${isDone ? "bg-primary" : "bg-border"}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : s.step}
              </div>
              <span
                className={`text-[11px] hidden sm:inline whitespace-nowrap ${
                  isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
