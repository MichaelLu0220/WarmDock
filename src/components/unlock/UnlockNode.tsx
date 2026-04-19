import { useState } from "react";
import type { UnlockNodeState } from "../../commands/types";
import type { IconKey } from "./unlockTreeLayout";
import { NODE_SIZE, CENTER_SIZE } from "./unlockTreeLayout";

type Props = {
  nodeId: string;
  x: number;
  y: number;
  icon: IconKey;
  state: UnlockNodeState;
  isCenter?: boolean;
  isRootAwakened: boolean;
  onClick?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;

  // Round B hold-to-unlock
  holdProgress?: number; // 0..1
  holdEnabled?: boolean; // 是否接受 hold(canBuy + 可互動時才開)
  onHoldMouseDown?: (e: React.MouseEvent) => void;
  onHoldMouseUp?: () => void;
  onHoldMouseLeave?: () => void;
};

function getNodeColors(
  state: UnlockNodeState,
  isCenter: boolean,
  isRootAwakened: boolean,
  hovered: boolean,
  isHoverable: boolean
): { fill: string; stroke: string; strokeDash: string | undefined } {
  let fill: string;
  let stroke: string;
  let strokeDash: string | undefined;

  if (isCenter && !state.unlocked) {
    fill = "var(--wd-cream)";
    stroke = "var(--wd-border)";
    strokeDash = "4 3";
  } else if (state.unlocked) {
    fill = "var(--wd-gold)";
    stroke = "var(--wd-border)";
    strokeDash = undefined;
  } else if (!state.requirements_met || !isRootAwakened) {
    fill = "var(--wd-paper)";
    stroke = "var(--wd-border-soft)";
    strokeDash = "3 4";
  } else if (!state.affordable) {
    fill = "var(--wd-cream)";
    stroke = "var(--wd-border-soft)";
    strokeDash = undefined;
  } else {
    fill = "var(--wd-cream)";
    stroke = "var(--wd-border)";
    strokeDash = undefined;
  }

  if (hovered && isHoverable) {
    fill = "var(--wd-gold-soft)";
  }

  return { fill, stroke, strokeDash };
}

function renderIcon(
  icon: IconKey,
  cx: number,
  cy: number,
  dim: boolean,
  isCenter: boolean
) {
  const color = dim ? "var(--wd-border-soft)" : "var(--wd-ink)";

  switch (icon) {
    case "sparkle":
      return (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontFamily="var(--wd-font-accent)"
          fontSize={isCenter ? "44" : "34"}
          fill={dim ? "var(--wd-orange)" : "var(--wd-ink)"}
        >
          ✦
        </text>
      );

    case "grid4":
    case "grid5":
    case "grid6":
    case "grid7": {
      const counts = { grid4: 4, grid5: 5, grid6: 6, grid7: 7 };
      const n = counts[icon];
      const cells = [];
      const cellSize = 10;
      const gap = 5;
      const cols = 3;
      const rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const offsetX = (col - (cols - 1) / 2) * (cellSize + gap);
        const offsetY = (row - (rows - 1) / 2) * (cellSize + gap);
        cells.push(
          <rect
            key={i}
            x={cx + offsetX - cellSize / 2}
            y={cy + offsetY - cellSize / 2}
            width={cellSize}
            height={cellSize}
            fill={color}
          />
        );
      }
      return <g>{cells}</g>;
    }

    case "star":
      return (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontFamily="var(--wd-font-accent)"
          fontSize="36"
          fill={dim ? "var(--wd-border-soft)" : "var(--wd-orange)"}
        >
          ★
        </text>
      );

    case "clock":
      return (
        <g fill="none" stroke={color} strokeWidth="3">
          <circle cx={cx} cy={cy} r="24" />
          <line x1={cx} y1={cy - 14} x2={cx} y2={cy} />
          <line x1={cx} y1={cy} x2={cx + 12} y2={cy} />
        </g>
      );

    case "bars":
      return (
        <g fill={dim ? "var(--wd-border-soft)" : "var(--wd-blue)"}>
          <rect x={cx - 20} y={cy + 8} width="6" height="10" />
          <rect x={cx - 10} y={cy - 4} width="6" height="22" />
          <rect x={cx} y={cy - 12} width="6" height="30" />
          <rect x={cx + 10} y={cy - 18} width="6" height="36" />
        </g>
      );
  }
}

export function UnlockNode({
  nodeId,
  x,
  y,
  icon,
  state,
  isCenter = false,
  isRootAwakened,
  onClick,
  onHoverEnter,
  onHoverLeave,
  holdProgress = 0,
  holdEnabled = false,
  onHoldMouseDown,
  onHoldMouseUp,
  onHoldMouseLeave,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const size = isCenter ? CENTER_SIZE : NODE_SIZE;
  const isHoverable = isCenter ? true : isRootAwakened;

  const { fill, stroke, strokeDash } = getNodeColors(
    state,
    isCenter,
    isRootAwakened,
    hovered,
    isHoverable
  );

  const dimIcon =
    !state.unlocked && (!state.requirements_met || !isRootAwakened);

  const showBreath = isCenter && !state.unlocked;

  // 注水層幾何
  const nodeLeft = x - size / 2;
  const nodeTop = y - size / 2;
  const fillHeight = size * Math.max(0, Math.min(1, holdProgress));
  const fillY = nodeTop + size - fillHeight;
  const showFill = holdProgress > 0.001;

  // 注水期間的戒指微光(進度 > 20% 才出現)
  const showHoldGlow = holdProgress > 0.2;

  return (
    <g
      data-node-id={nodeId}
      onClick={isHoverable ? onClick : undefined}
      onMouseEnter={() => {
        if (!isHoverable) return;
        setHovered(true);
        onHoverEnter?.();
      }}
      onMouseLeave={() => {
        if (!isHoverable) return;
        setHovered(false);
        onHoverLeave?.();
        // hold 也要取消
        if (holdEnabled) onHoldMouseLeave?.();
      }}
      onMouseDown={holdEnabled ? onHoldMouseDown : undefined}
      onMouseUp={holdEnabled ? onHoldMouseUp : undefined}
      style={{
        cursor: isHoverable ? (holdEnabled ? "grab" : "pointer") : "default",
      }}
    >
      {/* 呼吸圈 */}
      {showBreath && (
        <circle
          cx={x}
          cy={y}
          r={size / 2 + 12}
          fill="none"
          stroke="var(--wd-orange)"
          strokeWidth="3"
        >
          <animate
            attributeName="r"
            values={`${size / 2 + 10};${size / 2 + 24};${size / 2 + 10}`}
            dur="1.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0.75;0.25"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* 注水期間的 hold 輝光環 */}
      {showHoldGlow && (
        <rect
          x={nodeLeft - 6}
          y={nodeTop - 6}
          width={size + 12}
          height={size + 12}
          fill="none"
          stroke="var(--wd-gold)"
          strokeWidth="2"
          opacity={0.35 + holdProgress * 0.4}
        />
      )}

      {/* 節點主體 */}
      <rect
        x={nodeLeft}
        y={nodeTop}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth="3"
        strokeDasharray={strokeDash}
      />

      {/* 注水覆蓋層 — 從底部往上填 gold。clipPath 使用節點方框的 id */}
      {showFill && (
        <>
          <defs>
            <clipPath id={`wd-hold-clip-${nodeId}`}>
              <rect
                x={nodeLeft}
                y={nodeTop}
                width={size}
                height={size}
              />
            </clipPath>
          </defs>
          <rect
            x={nodeLeft}
            y={fillY}
            width={size}
            height={fillHeight}
            fill="var(--wd-gold)"
            opacity={0.78}
            clipPath={`url(#wd-hold-clip-${nodeId})`}
          />
          {/* 水面線 */}
          <line
            x1={nodeLeft}
            y1={fillY}
            x2={nodeLeft + size}
            y2={fillY}
            stroke="var(--wd-gold)"
            strokeWidth="2"
            clipPath={`url(#wd-hold-clip-${nodeId})`}
          />
        </>
      )}

      {renderIcon(icon, x, y, dimIcon, isCenter)}
    </g>
  );
}