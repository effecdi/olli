import { useRef, useState, useCallback } from "react";

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  magnetStrength?: number;
  className?: string;
  disabled?: boolean;
}

export function Magnet({
  children,
  padding = 60,
  magnetStrength = 3,
  className = "",
  disabled = false,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const maxDist = Math.max(rect.width, rect.height) / 2 + padding;

      if (dist < maxDist) {
        setIsActive(true);
        setTransform({
          x: distX / magnetStrength,
          y: distY / magnetStrength,
        });
      } else {
        setIsActive(false);
        setTransform({ x: 0, y: 0 });
      }
    },
    [disabled, padding, magnetStrength]
  );

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
    setTransform({ x: 0, y: 0 });
  }, []);

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: "inline-block" }}
    >
      <div
        ref={ref}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          transition: isActive
            ? "transform 0.3s ease-out"
            : "transform 0.5s ease-in-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
