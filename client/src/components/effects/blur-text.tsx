import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  stepDuration?: number;
}

export function BlurText({
  text,
  className = "",
  delay = 100,
  animateBy = "words",
  direction = "top",
  stepDuration = 0.35,
}: BlurTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <div ref={ref} className={`flex flex-wrap ${animateBy === "words" ? "gap-x-[0.3em]" : ""} ${className}`}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={{
            filter: "blur(12px)",
            opacity: 0,
            y: direction === "top" ? -20 : 20,
          }}
          animate={
            isInView
              ? { filter: "blur(0px)", opacity: 1, y: 0 }
              : {}
          }
          transition={{
            duration: stepDuration,
            delay: i * (delay / 1000),
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block will-change-[filter,opacity,transform]"
        >
          {el === " " ? "\u00A0" : el}
        </motion.span>
      ))}
    </div>
  );
}
