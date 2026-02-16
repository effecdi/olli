import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoImg from "@assets/logo.png";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useState } from "react";
import { GradientText } from "@/components/effects/gradient-text";
import { CountUp } from "@/components/effects/count-up";
import { TiltCard } from "@/components/effects/tilt-card";
import {
  Sparkles,
  Wand2,
  Repeat,
  ArrowRight,
  Zap,
  MessageCircle,
  Target,
  Paintbrush,
  Layers,
  Image as ImageIcon,
  PenTool,
  Palette,
  Users,
  Check,
} from "lucide-react";
import sample1 from "@assets/sample-char-1.png";
import sample2 from "@assets/sample-char-2.png";
import sample3 from "@assets/sample-char-3.png";
import sample4 from "@assets/sample-char-4.png";
import sample5 from "@assets/sample-char-5.png";
import sample6 from "@assets/sample-char-6.png";
import { Input } from "@/components/ui/input";

const allSamples = [sample1, sample2, sample3, sample4, sample5, sample6];

const SCATTERED_ITEMS = [
  { src: 0, top: "4%", left: "2%", size: "w-32 sm:w-44", rotate: -6, delay: 0.1 },
  { src: 1, top: "8%", right: "5%", size: "w-40 sm:w-56", rotate: 4, delay: 0.25 },
  { src: 2, top: "38%", left: "8%", size: "w-28 sm:w-36", rotate: -3, delay: 0.4 },
  { src: 3, bottom: "18%", right: "3%", size: "w-36 sm:w-48", rotate: 7, delay: 0.15 },
  { src: 4, bottom: "8%", left: "15%", size: "w-24 sm:w-32", rotate: -8, delay: 0.5 },
  { src: 5, top: "22%", right: "18%", size: "w-20 sm:w-28", rotate: 5, delay: 0.35 },
];

const MOBILE_SCATTERED = [
  { src: 0, top: "0%", left: "-4%", size: "w-24", rotate: -5, delay: 0.1 },
  { src: 1, top: "2%", right: "-2%", size: "w-28", rotate: 4, delay: 0.2 },
  { src: 2, bottom: "22%", left: "-2%", size: "w-20", rotate: -7, delay: 0.35 },
  { src: 3, bottom: "10%", right: "0%", size: "w-26", rotate: 6, delay: 0.15 },
  { src: 4, top: "40%", right: "5%", size: "w-16", rotate: -3, delay: 0.45 },
  { src: 5, bottom: "35%", left: "10%", size: "w-18", rotate: 8, delay: 0.3 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function ScatteredImage({ item, isMobile }: { item: typeof SCATTERED_ITEMS[0]; isMobile?: boolean }) {
  const posStyle: any = {};
  if ("top" in item && item.top) posStyle.top = item.top;
  if ("bottom" in item && (item as any).bottom) posStyle.bottom = (item as any).bottom;
  if ("left" in item && item.left) posStyle.left = item.left;
  if ("right" in item && (item as any).right) posStyle.right = (item as any).right;

  return (
    <motion.div
      className={`absolute ${item.size} aspect-[3/4] z-0`}
      style={{ ...posStyle, rotate: `${item.rotate}deg` }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: item.delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`img-scattered-${item.src}`}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl border-2 border-background/50 bg-card">
        <img
          src={allSamples[item.src]}
          alt={`인스타툰 캐릭터 샘플 ${item.src + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);
  const [promptText, setPromptText] = useState("");

  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const howInView = useInView(howRef, { once: true, margin: "-60px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-60px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(173_100%_35% / 0.06), transparent 70%)",
            }}
          />
        </div>

        <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
          {SCATTERED_ITEMS.map((item, i) => (
            <ScatteredImage key={i} item={item} />
          ))}
        </div>

        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          {MOBILE_SCATTERED.map((item, i) => (
            <ScatteredImage key={i} item={item} isMobile />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 py-28 sm:py-36 text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Badge variant="secondary" className="text-sm px-4 py-1.5" data-testid="badge-hero">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI 인스타툰 자동화
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4"
            data-testid="text-hero-title"
          >
            인스타툰,{" "}
            <GradientText
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mt-4"
              colors={["#3aedcf", "#050606", "#3bf680", "#edc63a"]}
              animationSpeed={5}
            >
              AI가 다 해줄게
            </GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto mb-10"
            data-testid="text-hero-desc"
          >
            텍스트 한 줄이면 캐릭터 생성부터 포즈, 배경, 말풍선까지.
            그림 못 그려도 괜찮아요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center gap-2 max-w-xl mx-auto mb-6 px-2"
            data-testid="section-hero-prompt"
          >
            <Input
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="내 인스타툰을 완성시킬 캐릭터를 생성해서 완성하세요."
              className="flex-1"
              data-testid="input-hero-prompt"
            />
            <Button
              size="lg"
              className="gap-2"
              asChild
              data-testid="button-hero-send"
            >
              <a href={`/create?prompt=${encodeURIComponent(promptText.trim())}`}>
                보내기
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <Button size="lg" className="gap-3 text-base w-full sm:w-auto" asChild data-testid="button-get-started">
              <a href="/login">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-3 text-base w-full sm:w-auto" asChild data-testid="button-pricing-link">
              <a href="/pricing">
                요금제 보기
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center justify-center gap-5 text-sm text-muted-foreground flex-wrap"
          >
            <span className="flex items-center gap-1.5" data-testid="text-hero-free-daily">
              <Zap className="h-3.5 w-3.5 text-primary" />
              매일 3회 무료
            </span>
            <span className="flex items-center gap-1.5" data-testid="text-hero-no-card">
              <Check className="h-3.5 w-3.5 text-primary" />
              카드 등록 불필요
            </span>
            <span className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-primary" />
              3가지 무료 스타일
            </span>
          </motion.div>
        </div>
      </section>

      <section className="border-t bg-card/50 py-12" data-testid="section-stats">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: 6, suffix: "가지", label: "AI 그림 스타일", icon: Palette },
              { value: 110, suffix: "+", label: "크리에이터", icon: Users },
              { value: 20, suffix: "종", label: "한글 폰트", icon: PenTool },
              { value: 5, suffix: "초", label: "평균 생성", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-black mb-0.5" data-testid={`text-stat-value-${i}`}>
                  <CountUp to={stat.value} duration={2.5} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-muted-foreground" data-testid={`text-stat-label-${i}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={howRef} className="border-t py-20 sm:py-28" data-testid="section-how-it-works">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial="hidden" animate={howInView ? "visible" : "hidden"} variants={fadeUp} custom={0}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            >
              이렇게 쉬워요
            </motion.h2>
            <motion.p
              initial="hidden" animate={howInView ? "visible" : "hidden"} variants={fadeUp} custom={1}
              className="text-lg text-muted-foreground"
            >
              3단계면 인스타툰 완성
            </motion.p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "01", icon: PenTool, title: "캐릭터 설명", desc: "\"안경 쓴 귀여운 고양이\" 처럼 원하는 캐릭터를 텍스트로 설명하세요", gradient: "from-violet-500 to-purple-600" },
              { step: "02", icon: Sparkles, title: "AI가 즉시 생성", desc: "선택한 스타일에 맞춰 AI가 인스타툰 캐릭터를 그려줍니다", gradient: "from-pink-500 to-rose-600" },
              { step: "03", icon: Repeat, title: "포즈 & 활용", desc: "다양한 포즈, 배경, 말풍선으로 인스타툰 컷을 완성하세요", gradient: "from-blue-500 to-cyan-600" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                animate={howInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={i + 2}
                className="text-center"
                data-testid={`card-step-${item.step}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} mx-auto mb-5 flex items-center justify-center shadow-lg`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="font-bold text-lg mb-2" data-testid={`text-step-title-${item.step}`}>{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-step-desc-${item.step}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      

      <section ref={featuresRef} className="border-t bg-card/30 py-20 sm:py-28" data-testid="section-core-features">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial="hidden" animate={featuresInView ? "visible" : "hidden"} variants={fadeUp} custom={0}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            >
              인스타툰 제작의 모든 것
            </motion.h2>
            <motion.p
              initial="hidden" animate={featuresInView ? "visible" : "hidden"} variants={fadeUp} custom={1}
              className="text-lg text-muted-foreground"
            >
              캐릭터 생성부터 편집까지 한 곳에서
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              { icon: Wand2, title: "AI 캐릭터 생성", desc: "텍스트 설명만으로 인스타툰 스타일 캐릭터를 즉시 생성", color: "bg-violet-500/10 dark:bg-violet-500/20", iconColor: "text-violet-500 dark:text-violet-400", testId: "card-feature-character" },
              { icon: Layers, title: "포즈 & 표정", desc: "같은 캐릭터로 다양한 포즈와 표정을 무한 생성", color: "bg-blue-500/10 dark:bg-blue-500/20", iconColor: "text-blue-500 dark:text-blue-400", testId: "card-feature-pose" },
              { icon: ImageIcon, title: "배경 & 아이템", desc: "카페, 공원, 교실 등 배경과 소품을 추가", color: "bg-emerald-500/10 dark:bg-emerald-500/20", iconColor: "text-emerald-500 dark:text-emerald-400", testId: "card-feature-background" },
              { icon: Paintbrush, title: "말풍선 편집기", desc: "20가지 한글 손글씨 폰트로 말풍선 자유 편집", color: "bg-indigo-500/10 dark:bg-indigo-500/20", iconColor: "text-indigo-500 dark:text-indigo-400", testId: "card-feature-bubble" },
              { icon: MessageCircle, title: "카카오톡 채팅 이미지", desc: "내 캐릭터로 카톡 스타일 채팅 화면 제작", color: "bg-amber-500/10 dark:bg-amber-500/20", iconColor: "text-amber-500 dark:text-amber-400", testId: "card-feature-chat", pro: true },
              { icon: Target, title: "AI 광고주 매칭", desc: "AI가 내 프로필에 맞는 광고주를 추천", color: "bg-rose-500/10 dark:bg-rose-500/20", iconColor: "text-rose-500 dark:text-rose-400", testId: "card-feature-admatch", pro: true },
            ].map((feature) => (
              <motion.div key={feature.testId} variants={staggerItem}>
                <TiltCard className="h-full rounded-md">
                  <Card className="p-6 h-full" data-testid={feature.testId}>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                      <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    {feature.pro && (
                      <Badge variant="secondary" className="mt-3">Pro</Badge>
                    )}
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={pricingRef} className="border-t py-20 sm:py-28" data-testid="section-pricing-summary">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <motion.h2
              initial="hidden" animate={pricingInView ? "visible" : "hidden"} variants={fadeUp} custom={0}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            >
              무료로 시작하세요
            </motion.h2>
            <motion.p
              initial="hidden" animate={pricingInView ? "visible" : "hidden"} variants={fadeUp} custom={1}
              className="text-lg text-muted-foreground"
            >
              필요할 때 업그레이드하면 돼요
            </motion.p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
            <motion.div initial="hidden" animate={pricingInView ? "visible" : "hidden"} variants={fadeUp} custom={2}>
              <TiltCard className="h-full rounded-md" maxTilt={5}>
                <Card className="p-7 h-full" data-testid="card-pricing-free">
                  <h3 className="font-bold text-xl mb-2">Free</h3>
                  <div className="text-3xl font-black mb-5">
                    ₩0
                    <span className="text-base font-normal text-muted-foreground">/월</span>
                  </div>
                  <ul className="space-y-2.5 text-sm text-muted-foreground mb-7">
                    <li className="flex items-center gap-2.5"><Zap className="h-4 w-4 text-primary shrink-0" /> 매일 1회 캐릭터 생성</li>
                    <li className="flex items-center gap-2.5"><Palette className="h-4 w-4 text-primary shrink-0" /> 기본 스타일만 가능</li>
                    <li className="flex items-center gap-2.5"><Layers className="h-4 w-4 text-primary shrink-0" /> 워터마크 포함</li>
                    <li className="flex items-center gap-2.5"><Paintbrush className="h-4 w-4 text-primary shrink-0" /> 에디터 기능 제한</li>
                  </ul>
                  <Button className="w-full" size="lg" variant="outline" asChild data-testid="button-pricing-free">
                    <a href="/login">무료로 시작하기</a>
                  </Button>
                </Card>
              </TiltCard>
            </motion.div>

            <motion.div initial="hidden" animate={pricingInView ? "visible" : "hidden"} variants={fadeUp} custom={3}>
              <TiltCard className="h-full rounded-md" maxTilt={5}>
                <Card className="p-7 border-primary/30 bg-primary/[0.03] h-full relative overflow-visible" data-testid="card-pricing-pro">
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">추천</Badge>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-xl">Pro</h3>
                  </div>
                  <div className="text-3xl font-black mb-5">
                    ₩19,900
                    <span className="text-base font-normal text-muted-foreground">/월</span>
                  </div>
                  <ul className="space-y-2.5 text-sm text-muted-foreground mb-7">
                    <li className="flex items-center gap-2.5"><Zap className="h-4 w-4 text-primary shrink-0" /> 무제한 캐릭터 생성</li>
                    <li className="flex items-center gap-2.5"><Palette className="h-4 w-4 text-primary shrink-0" /> 6가지 전체 스타일</li>
                    <li className="flex items-center gap-2.5"><MessageCircle className="h-4 w-4 text-primary shrink-0" /> 카카오톡 채팅 이미지</li>
                    <li className="flex items-center gap-2.5"><Target className="h-4 w-4 text-primary shrink-0" /> AI 광고주 매칭</li>
                  </ul>
                  <Button className="w-full" size="lg" asChild data-testid="button-pricing-pro">
                    <a href="/login">Pro 시작하기</a>
                  </Button>
                </Card>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="border-t bg-card/30 py-24 sm:py-32 relative overflow-hidden" data-testid="section-cta-bottom">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 50%, hsl(173_100%_35% / 0.05), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <GradientText
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
              colors={["#3ae1ed", "#4861ec", "#3b82f6", "#3ae4ed"]}
              animationSpeed={4}
            >
              지금 바로 만들어보세요
            </GradientText>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-muted-foreground max-w-md mx-auto mt-5 mb-8"
          >
            그림 실력 없어도 OK. 텍스트만 넣으면 AI가 해결합니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="gap-3 text-base" asChild data-testid="button-cta-bottom-start">
              <a href="/login">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5" data-testid="footer-logo">
            <img src={logoImg} alt="OLLI" className="h-6 w-6 rounded object-cover" />
            <span className="font-bold text-base">OLLI</span>
          </div>
          <p data-testid="text-footer-copyright">&copy; {new Date().getFullYear()} OLLI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
