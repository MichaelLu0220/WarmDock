import { useEffect, useRef } from "react";
import type { UnlockNodeState } from "../../commands/types";
import type { TreeNodeLayout, UnlockCategory } from "./unlockTreeLayout";

type Props = {
  layout: TreeNodeLayout;
  state: UnlockNodeState;
  availablePoints: number;
  isRootAwakened: boolean;
  isCenter: boolean;
  purchaseError: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** 節點在 panel 容器內的螢幕座標(px) */
  anchor: { x: number; y: number; halfW: number; halfH: number };
  /** panel 容器寬高,用於邊界判斷 */
  panelRect: { w: number; h: number };
};

const TOOLTIP_W = 320;
const GAP = -10;

function getCategoryLabel(category: UnlockCategory): string {
  switch (category) {
    case "core":
      return "核心";
    case "capacity":
      return "容量";
    case "focus":
      return "焦點";
    case "time":
      return "節奏";
    case "analysis":
      return "分析";
    default:
      return "能力";
  }
}

function getCategoryColors(category: UnlockCategory): {
  bg: string;
  border: string;
} {
  switch (category) {
    case "core":
      return { bg: "var(--wd-gold-soft)", border: "var(--wd-gold)" };
    case "capacity":
      return { bg: "#efe1bd", border: "var(--wd-border-soft)" };
    case "focus":
      return { bg: "var(--wd-blue-soft)", border: "var(--wd-blue)" };
    case "time":
      return { bg: "#e4f0ea", border: "#7aa087" };
    case "analysis":
      return { bg: "#eadff4", border: "#8a72ad" };
    default:
      return { bg: "var(--wd-paper)", border: "var(--wd-border-soft)" };
  }
}

function getRequirementText(
  layout: TreeNodeLayout,
  isRootAwakened: boolean,
  requirementsMet: boolean
): string {
  switch (layout.node_id) {
    case "root.awaken":
      return "無前置需求";
    case "slots.4":
    case "focus.basic":
    case "time.custom_refresh":
    case "analysis.weekly":
      return isRootAwakened ? "前置已滿足" : "需先完成覺醒";
    case "slots.5":
      return "需先解鎖『多一個容器』";
    case "slots.6":
      return "需先解鎖『再深一些』";
    case "slots.7":
      return "需先解鎖『不只於此』";
    default:
      return requirementsMet ? "前置已滿足" : "前置未滿足";
  }
}

export function UnlockTooltip({
  layout,
  state,
  availablePoints,
  isRootAwakened,
  isCenter,
  purchaseError,
  onMouseEnter,
  onMouseLeave,
  anchor,
  panelRect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  let statusText = "";
  let statusColor = "var(--wd-ink-soft)";
  let canBuy = false;

  if (state.unlocked) {
    statusText = "已解鎖";
    statusColor = "var(--wd-green)";
  } else if (!isRootAwakened && !isCenter) {
    statusText = "未覺醒";
    statusColor = "var(--wd-dim)";
  } else if (!state.requirements_met) {
    statusText = "前置未滿足";
    statusColor = "var(--wd-red)";
  } else if (state.affordable) {
    statusText = "可解鎖";
    statusColor = "var(--wd-green)";
    canBuy = true;
  } else {
    statusText = "點數不足";
    statusColor = "var(--wd-orange)";
  }

  // 覺醒特例:cost=0,沒有點數門檻
  if (isCenter && !state.unlocked) {
    statusText = "等待覺醒";
    statusColor = "var(--wd-orange)";
    canBuy = true;
  }

  const requirementText = getRequirementText(
    layout,
    isRootAwakened,
    state.requirements_met
  );
  const categoryColors = getCategoryColors(layout.category);
  const missingPoints = Math.max(0, state.cost - availablePoints);
  const remainingAfterBuy = Math.max(0, availablePoints - state.cost);

  const computePos = () => {
    const nodeRight = anchor.x + anchor.halfW + GAP;
    const nodeLeft = anchor.x - anchor.halfW - GAP - TOOLTIP_W;

    let left: number;
    if (layout.direction === "left") {
      left = nodeLeft < 10 ? nodeRight : nodeLeft;
    } else if (layout.direction === "right") {
      left = nodeRight + TOOLTIP_W > panelRect.w - 10 ? nodeLeft : nodeRight;
    } else {
      left = nodeRight + TOOLTIP_W > panelRect.w - 10 ? nodeLeft : nodeRight;
    }

    const estH = ref.current?.offsetHeight ?? 300;
    let top = anchor.y - estH / 2;
    if (top < 10) top = 10;
    if (top + estH > panelRect.h - 10) top = panelRect.h - 10 - estH;

    return { left, top };
  };

  const pos = computePos();

  useEffect(() => {
    if (ref.current) {
      void ref.current.getBoundingClientRect();
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: TOOLTIP_W,
        background: "var(--wd-cream)",
        border: "2px solid var(--wd-border)",
        boxShadow:
          "inset 0 0 0 2px var(--wd-cream), inset 0 0 0 4px var(--wd-border-soft), 5px 5px 0 var(--wd-border)",
        padding: "18px 20px",
        fontFamily: "var(--wd-font-body)",
        fontSize: 16,
        color: "var(--wd-ink)",
        zIndex: 5,
        pointerEvents: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 24,
            padding: "0 8px",
            border: `2px solid ${categoryColors.border}`,
            background: categoryColors.bg,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {getCategoryLabel(layout.category)}
        </span>
        {!state.unlocked && !isCenter && (
          <span
            style={{ color: "var(--wd-gold)", fontWeight: 700, fontSize: 16 }}
          >
            ◆ {state.cost}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
        {layout.displayName}
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: "var(--wd-ink-soft)",
          marginBottom: 12,
        }}
      >
        {layout.description}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--wd-border-soft)",
          marginBottom: 12,
        }}
      />

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>效果</div>
      <ul
        style={{
          margin: "0 0 12px 18px",
          padding: 0,
          fontSize: 15,
          lineHeight: 1.65,
        }}
      >
        {layout.effectLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 15,
          marginBottom: 8,
          color: "var(--wd-ink-soft)",
        }}
      >
        <span>需求</span>
        <span style={{ color: "var(--wd-ink)", textAlign: "right" }}>
          {requirementText}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 15,
          marginBottom: 12,
          color: "var(--wd-ink-soft)",
        }}
      >
        <span>狀態</span>
        <span
          style={{ color: statusColor, fontWeight: 700, textAlign: "right" }}
        >
          {statusText}
        </span>
      </div>

      {!state.unlocked && missingPoints > 0 && !isCenter && (
        <div
          style={{
            fontSize: 14,
            color: "var(--wd-orange)",
            marginBottom: 10,
          }}
        >
          還差 ◆ {missingPoints}
        </div>
      )}

      <div
        style={{
          fontSize: 15,
          color: "var(--wd-ink-soft)",
          lineHeight: 1.6,
          fontStyle: "italic",
          marginBottom: 12,
        }}
      >
        「{layout.mantra}」
      </div>

      {purchaseError && (
        <div
          style={{
            fontSize: 14,
            color: "var(--wd-red)",
            marginBottom: 10,
          }}
        >
          {purchaseError}
        </div>
      )}

      {/* 可解鎖時的互動提示 — 取代原本的按鈕 */}
      {canBuy && !state.unlocked && (
        <div
          style={{
            marginTop: 4,
            padding: "10px 12px",
            background: "var(--wd-paper)",
            border: "2px dashed var(--wd-border-soft)",
            fontSize: 14,
            lineHeight: 1.5,
            textAlign: "center",
            color: "var(--wd-ink)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            按住方塊 2 秒
          </div>
          <div style={{ fontSize: 12, color: "var(--wd-ink-soft)" }}>
            {isCenter ? "準備覺醒" : "準備解鎖"}
          </div>
        </div>
      )}

      {!state.unlocked && !isCenter && (
        <div
          style={{
            fontSize: 13,
            color: "var(--wd-ink-soft)",
            textAlign: "right",
            marginTop: 10,
            lineHeight: 1.5,
          }}
        >
          <div>可用 ◆ {availablePoints}</div>
          {canBuy && <div>解鎖後 ◆ {remainingAfterBuy}</div>}
        </div>
      )}

      {state.unlocked && (
        <div
          style={{
            fontSize: 13,
            color: "var(--wd-ink-soft)",
            textAlign: "right",
            marginTop: 10,
          }}
        >
          此效果已生效
          {state.unlocked_at && <div>解鎖於 {state.unlocked_at.slice(0, 10)}</div>}
        </div>
      )}
    </div>
  );
}