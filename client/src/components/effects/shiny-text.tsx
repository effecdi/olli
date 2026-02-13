interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
  shineColor?: string;
  disabled?: boolean;
}

export function ShinyText({
  text,
  className = "",
  speed = 3,
  shineColor = "rgba(255,255,255,0.3)",
  disabled = false,
}: ShinyTextProps) {
  const animName = "shiny-sweep";

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      <span
        className={className}
        style={
          disabled
            ? {}
            : {
                backgroundImage: `linear-gradient(120deg, transparent 40%, ${shineColor} 50%, transparent 60%)`,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text" as const,
                backgroundClip: "text" as const,
                animation: `${animName} ${speed}s linear infinite`,
              }
        }
      >
        {text}
      </span>
    </>
  );
}
