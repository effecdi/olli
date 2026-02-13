import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Wand2,
  Layers,
  Type,
  MessageCircle,
  Upload,
  Plus,
  Save,
  MousePointer2,
  Sparkles,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OnboardingStep {
  icon: typeof Wand2;
  title: string;
  description: string;
  tip?: string;
}

const STORY_STEPS: OnboardingStep[] = [
  {
    icon: Wand2,
    title: "AI로 스크립트 생성",
    description: "좌측 'AI 생성' 탭에서 주제를 입력하면, AI가 패널별 자막과 말풍선 텍스트를 자동으로 만들어줍니다.",
    tip: "주제 추천 버튼으로 아이디어를 받아보세요",
  },
  {
    icon: Layers,
    title: "패널 관리",
    description: "'패널' 탭에서 패널을 추가, 복제, 삭제할 수 있어요. 상단 화살표로 패널 간 이동도 가능합니다.",
    tip: "패널은 최대 10개까지 추가 가능해요",
  },
  {
    icon: ImagePlus,
    title: "캐릭터 이미지 배치",
    description: "'편집' 탭에서 갤러리의 캐릭터 이미지를 패널에 넣을 수 있어요. 드래그로 위치와 크기를 조절하세요.",
    tip: "캐릭터 만들기에서 생성한 이미지가 갤러리에 있어요",
  },
  {
    icon: MessageCircle,
    title: "말풍선 추가",
    description: "'편집' 탭에서 말풍선을 추가하고, 텍스트를 입력하세요. 스타일, 꼬리, 폰트도 바꿀 수 있어요.",
    tip: "말풍선을 캔버스에서 직접 드래그해서 이동/크기 조절",
  },
  {
    icon: Type,
    title: "상단/하단 스크립트",
    description: "'스크립트' 탭에서 패널 위아래에 자막 텍스트를 넣을 수 있어요. 폰트, 색상, 스타일을 자유롭게 설정하세요.",
    tip: "캔버스에서 스크립트를 드래그해서 위치 조절 가능",
  },
  {
    icon: Save,
    title: "저장 & 공유",
    description: "상단 바에서 다운로드, 저장(Pro), Instagram 공유가 가능합니다. '내 편집'에서 저장된 프로젝트를 관리하세요.",
    tip: "Pro 멤버십이면 프로젝트를 저장/불러오기할 수 있어요",
  },
];

const BUBBLE_STEPS: OnboardingStep[] = [
  {
    icon: Upload,
    title: "이미지 업로드",
    description: "상단 '업로드' 버튼으로 배경 이미지를 불러오세요. 캐릭터 만들기에서 생성한 이미지를 사용할 수 있어요.",
    tip: "'캐릭터' 버튼으로 갤러리에서 바로 가져올 수도 있어요",
  },
  {
    icon: Plus,
    title: "말풍선 추가",
    description: "'추가' 버튼을 누르면 말풍선이 생성돼요. 오른쪽 패널에서 텍스트, 스타일, 꼬리 방향을 설정하세요.",
    tip: "템플릿 버튼으로 다양한 말풍선 디자인을 쓸 수 있어요",
  },
  {
    icon: MousePointer2,
    title: "말풍선 편집",
    description: "캔버스에서 말풍선을 클릭해 선택하고, 드래그로 이동하세요. 모서리를 잡아 크기를 조절할 수 있어요.",
    tip: "오른쪽 패널에서 폰트, 크기, 스트로크 등 세부 설정 가능",
  },
  {
    icon: ImagePlus,
    title: "캐릭터 오버레이",
    description: "'캐릭터' 버튼으로 갤러리에서 캐릭터를 불러와 이미지 위에 배치할 수 있어요.",
    tip: "캐릭터도 드래그로 위치와 크기를 자유롭게 조절",
  },
  {
    icon: Save,
    title: "저장 & 공유",
    description: "상단 바에서 다운로드, 저장(Pro), Instagram 공유가 가능합니다. '내 편집'에서 저장된 프로젝트를 관리하세요.",
    tip: "Pro 멤버십이면 프로젝트를 저장/불러오기할 수 있어요",
  },
];

const ONBOARDING_KEY_STORY = "charagen_story_onboarding_seen";
const ONBOARDING_KEY_BUBBLE = "charagen_bubble_onboarding_seen";

export function EditorOnboarding({ editor }: { editor: "story" | "bubble" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = editor === "story" ? STORY_STEPS : BUBBLE_STEPS;
  const storageKey = editor === "story" ? ONBOARDING_KEY_STORY : ONBOARDING_KEY_BUBBLE;

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(storageKey, "1");
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0" data-testid="modal-editor-onboarding">
        <div className="relative">
          <div className="bg-gradient-to-br from-[hsl(262_83%_58%)] to-[hsl(262_83%_45%)] px-6 pt-8 pb-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 opacity-80" />
              <span className="text-[11px] font-medium opacity-80 uppercase tracking-wider">
                {editor === "story" ? "Story Editor" : "Bubble Editor"} Guide
              </span>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <current.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight" data-testid="text-onboarding-title">{current.title}</h3>
                <span className="text-[11px] opacity-70">Step {step + 1} / {steps.length}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 px-6 -mt-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors ${i <= step ? "bg-[hsl(262_83%_58%)]" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-sm leading-relaxed text-foreground" data-testid="text-onboarding-desc">
            {current.description}
          </p>
          {current.tip && (
            <div className="mt-3 flex items-start gap-2 bg-muted/50 dark:bg-muted/30 rounded-lg px-3 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(262_83%_58%)] shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed" data-testid="text-onboarding-tip">{current.tip}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 pb-5 pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 0}
            className="gap-1"
            data-testid="button-onboarding-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            이전
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground"
              data-testid="button-onboarding-skip"
            >
              건너뛰기
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 bg-[hsl(262_83%_58%)] text-white border-[hsl(262_83%_52%)]"
              data-testid="button-onboarding-next"
            >
              {step === steps.length - 1 ? "시작하기" : "다음"}
              {step < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
