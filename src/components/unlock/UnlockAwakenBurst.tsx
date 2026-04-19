import { useEffect, useState } from "react";
import { TREE_CENTER } from "./unlockTreeLayout";

/**
 * 覺醒時的光芒動畫。
 * 顯示 600ms 後自動消失。
 */
export function UnlockAwakenBurst({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0..3 三階段

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 220);
    const t3 = setTimeout(() => setPhase(3), 380);
    const tEnd = setTimeout(() => onDone(), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
    };
  }, [onDone]);

  const { x: cx, y: cy } = TREE_CENTER;

  // 8 道射線角度
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];

  const ringRadius = phase === 0 ? 0 : phase === 1 ? 28 : phase === 2 ? 42 : 58;
  const ringOpacity = phase >= 3 ? 0 : 0.9 - phase * 0.25;
  const rayLen = phase === 0 ? 0 : phase === 1 ? 14 : phase === 2 ? 22 : 30;

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* 3 層同心圓 */}
      <circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        fill="none"
        stroke="var(--wd-gold)"
        strokeWidth="2"
        opacity={ringOpacity}
      />
      {phase >= 1 && (
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius + 10}
          fill="none"
          stroke="var(--wd-gold-soft)"
          strokeWidth="1.5"
          opacity={Math.max(0, ringOpacity - 0.3)}
        />
      )}

      {/* 8 道射線 */}
      {phase >= 1 &&
        rays.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const offset = 32;
          const x1 = cx + Math.cos(rad) * offset;
          const y1 = cy + Math.sin(rad) * offset;
          const x2 = cx + Math.cos(rad) * (offset + rayLen);
          const y2 = cy + Math.sin(rad) * (offset + rayLen);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--wd-gold)"
              strokeWidth={deg % 90 === 0 ? 3 : 2}
              opacity={ringOpacity}
            />
          );
        })}
    </g>
  );
}