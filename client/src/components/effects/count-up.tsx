import { useRef, useEffect } from "react";
import { useInView, useMotionValue, useSpring, motion } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  separator?: string;
  suffix?: string;
  prefix?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 2,
  className = "",
  separator = "",
  suffix = "",
  prefix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(from);
  const spring = useSpring(motionVal, {
    damping: 30 + duration * 10,
    stiffness: 80 - duration * 5,
  });

  useEffect(() => {
    if (isInView) {
      motionVal.set(to);
    }
  }, [isInView, to, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) {
        const num = Math.round(v);
        let formatted = num.toString();
        if (separator) {
          formatted = num.toLocaleString("en-US").replace(/,/g, separator);
        }
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
    return unsub;
  }, [spring, separator, suffix, prefix]);

  return <span ref={ref} className={className}>{prefix}{from}{suffix}</span>;
}
