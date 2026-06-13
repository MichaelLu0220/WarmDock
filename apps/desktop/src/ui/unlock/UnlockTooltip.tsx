import { useLayoutEffect, useRef } from "react";
import type { UnlockNodeState } from "@warmdock/core/types";
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
  /** docked 第二頁面:卡片窄,改用「卡內全寬覆蓋面板」避免說明文字被裁切 */
  compact: boolean;
  /** 第三頁面:游標座標(卡片內 px),說明卡跟隨滑鼠;null = 不跟隨 */
  pointer: { x: number; y: number } | null;
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
      return { bg: "var(--wd-tip-tan-bg)", border: "var(--wd-border-soft)" };
    case "focus":
      return { bg: "var(--wd-blue-soft)", border: "var(--wd-blue)" };
    case "time":
      return {
        bg: "var(--wd-tip-green-bg)",
        border: "var(--wd-tip-green-border)",
      };
    case "analysis":
      return {
        bg: "var(--wd-tip-purple-bg)",
        border: "var(--wd-tip-purple-border)",
      };
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
  compact,
  pointer,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  let statusText: string;
  let statusColor: string;
  let canBuy = false;

  if (state.unlocked) {
    statusText = "已解鎖";
    statusColor = "var(--wd-green)";
  } else if (!isRootAwakened && !isCenter) {
    statusText = "未覺醒";
    statusColor = "var(--wd-dim)";
  } else if (!state.requirementsMet) {
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
    state.requirementsMet
  );
  const categoryColors = getCategoryColors(layout.category);
  const missingPoints = Math.max(0, state.cost - availablePoints);
  const remainingAfterBuy = Math.max(0, availablePoints - state.cost);

  // 字級/間距:compact(docked)整體縮一階,讓窄卡片塞得下完整說明。
  const fz = compact
    ? {
        chip: 11,
        cost: 14,
        title: 15,
        body: 13,
        small: 12,
        foot: 12,
        hintTitle: 13,
        hintSub: 11,
      }
    : {
        chip: 12,
        cost: 16,
        title: 20,
        body: 15,
        small: 14,
        foot: 13,
        hintTitle: 14,
        hintSub: 12,
      };
  const padOuter = compact ? "12px 14px" : "18px 20px";
  const mb = compact ? 8 : 12; // 區塊間距
  const lh = compact ? 1.5 : 1.65;

  // ── 定位 ──
  // compact:卡內全寬,放在節點「上方或下方」(取空間較大的一側),不覆蓋節點
  //   本身 —— 否則會擋住「按住方塊 2 秒」的解鎖手勢。
  // expanded:沿用節點旁側顯示。
  const M = 8;
  const POFF = 16;
  // 第二頁面(compact)與第三頁面都讓說明卡跟隨滑鼠;有游標座標即啟用。
  const followPointer = !!pointer;
  // compact 卡片窄,說明卡也收窄(夾在卡內、不超出);expanded 用固定寬。
  const tipW = compact
    ? Math.min(Math.max(0, panelRect.w - 16), 280)
    : TOOLTIP_W;
  // compact 高度上限為卡片高,內容(已精簡)通常塞得下。
  const maxHeight = compact ? Math.max(120, panelRect.h - 2 * M) : undefined;

  let left: number;
  if (followPointer && pointer) {
    // 游標右下偏移;溢出右緣則翻到游標左側,再夾進卡片內。
    left = pointer.x + POFF;
    if (left + tipW > panelRect.w - M) left = pointer.x - tipW - POFF;
    if (left < M) left = M;
  } else if (compact) {
    left = Math.max(M, (panelRect.w - tipW) / 2);
  } else {
    const nodeRight = anchor.x + anchor.halfW + GAP;
    const nodeLeft = anchor.x - anchor.halfW - GAP - tipW;
    if (layout.direction === "left") {
      left = nodeLeft < 10 ? nodeRight : nodeLeft;
    } else {
      left = nodeRight + tipW > panelRect.w - 10 ? nodeLeft : nodeRight;
    }
  }

  // render 階段不能讀 ref,先用估計高度排版,
  // paint 前由 useLayoutEffect 量實際高度修正 top(不會閃)
  const EST_H = compact ? 200 : 300;
  const estTop =
    followPointer && pointer
      ? pointer.y + POFF
      : Math.max(M, anchor.y - EST_H / 2);
  const pos = { left, top: estTop };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    let top: number;
    if (followPointer && pointer) {
      top = pointer.y + POFF;
      if (top + h > panelRect.h - M) top = pointer.y - h - POFF;
      if (top < M) top = M;
    } else {
      top = anchor.y - h / 2;
      if (top < 10) top = 10;
      if (top + h > panelRect.h - 10) top = panelRect.h - 10 - h;
    }
    el.style.top = `${top}px`;
  });

  return (
    <div
      ref={ref}
      onMouseEnter={followPointer ? undefined : onMouseEnter}
      onMouseLeave={followPointer ? undefined : onMouseLeave}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: tipW,
        maxHeight,
        overflowY: maxHeight ? "auto" : "visible",
        background: "var(--wd-cream)",
        border: "2px solid var(--wd-border)",
        boxShadow:
          "inset 0 0 0 2px var(--wd-cream), inset 0 0 0 4px var(--wd-border-soft), 5px 5px 0 var(--wd-border)",
        padding: padOuter,
        fontFamily: "var(--wd-font-body)",
        fontSize: fz.body,
        color: "var(--wd-ink)",
        zIndex: 5,
        // 跟隨滑鼠時不攔截指標(穿透),確保游標離開節點即消失、不會卡在說明卡上;
        // 並加上短暫補間做出柔順的跟隨拖尾。
        pointerEvents: followPointer ? "none" : "auto",
        transition: followPointer
          ? "left 90ms ease-out, top 90ms ease-out"
          : undefined,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: mb,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: compact ? 20 : 24,
            padding: "0 8px",
            border: `2px solid ${categoryColors.border}`,
            background: categoryColors.bg,
            fontSize: fz.chip,
            lineHeight: 1,
          }}
        >
          {getCategoryLabel(layout.category)}
        </span>
        {!state.unlocked && !isCenter && (
          <span
            style={{
              color: "var(--wd-gold)",
              fontWeight: 700,
              fontSize: fz.cost,
            }}
          >
            ◆ {state.cost}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: fz.title, marginBottom: 6 }}>
        {layout.displayName}
      </div>
      <div
        style={{
          fontSize: fz.body,
          lineHeight: lh,
          color: "var(--wd-ink-soft)",
          marginBottom: mb,
        }}
      >
        {layout.description}
      </div>

      {/* 效果清單:compact(第二頁面)省略,完整內容在放大的第三頁面顯示 */}
      {!compact && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--wd-border-soft)",
              marginBottom: mb,
            }}
          />

          <div style={{ fontSize: fz.body, fontWeight: 700, marginBottom: 6 }}>
            效果
          </div>
          <ul
            style={{
              margin: `0 0 ${mb}px 18px`,
              padding: 0,
              fontSize: fz.body,
              lineHeight: lh,
            }}
          >
            {layout.effectLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: fz.body,
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
          fontSize: fz.body,
          marginBottom: mb,
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
            fontSize: fz.small,
            color: "var(--wd-orange)",
            marginBottom: 10,
          }}
        >
          還差 ◆ {missingPoints}
        </div>
      )}

      {/* 標語:compact 省略以節省高度 */}
      {!compact && (
        <div
          style={{
            fontSize: fz.body,
            color: "var(--wd-ink-soft)",
            lineHeight: lh,
            fontStyle: "italic",
            marginBottom: mb,
          }}
        >
          「{layout.mantra}」
        </div>
      )}

      {purchaseError && (
        <div
          style={{
            fontSize: fz.small,
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
            padding: compact ? "8px 10px" : "10px 12px",
            background: "var(--wd-paper)",
            border: "2px dashed var(--wd-border-soft)",
            fontSize: fz.small,
            lineHeight: 1.5,
            textAlign: "center",
            color: "var(--wd-ink)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>按住方塊 2 秒</div>
          <div style={{ fontSize: fz.hintSub, color: "var(--wd-ink-soft)" }}>
            {isCenter ? "準備覺醒" : "準備解鎖"}
          </div>
        </div>
      )}

      {/* 可用/解鎖後點數:compact 省略(卡片標題列已顯示可用點數) */}
      {!compact && !state.unlocked && !isCenter && (
        <div
          style={{
            fontSize: fz.foot,
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
            fontSize: fz.foot,
            color: "var(--wd-ink-soft)",
            textAlign: "right",
            marginTop: 10,
          }}
        >
          此效果已生效
          {state.unlockedAt && <div>解鎖於 {state.unlockedAt.slice(0, 10)}</div>}
        </div>
      )}
    </div>
  );
}
