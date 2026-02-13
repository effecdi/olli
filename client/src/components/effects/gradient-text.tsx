import { useRef } from "react";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  direction?: "horizontal" | "vertical" | "diagonal";
}

export function GradientText({
  children,
  className = "",
  colors = ["#7c3aed", "#ec4899", "#7c3aed", "#ec4899"],
  animationSpeed = 6,
  direction = "horizontal",
}: GradientTextProps) {
  const gradientDirection =
    direction === "horizontal"
      ? "to right"
      : direction === "vertical"
      ? "to bottom"
      : "to bottom right";

  const gradientStyle = {
    backgroundImage: `linear-gradient(${gradientDirection}, ${colors.join(", ")})`,
    backgroundSize: direction === "horizontal" ? "300% 100%" : direction === "vertical" ? "100% 300%" : "300% 300%",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    WebkitTextFillColor: "transparent",
    animation: `gradient-shift ${animationSpeed}s ease-in-out infinite alternate`,
  };

  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
      <span className={`inline-block ${className}`} style={gradientStyle}>
        {children}
      </span>
    </>
  );
}
