import { useEffect, useRef, useState } from "react";
import { loadUnlockProgress, purchaseUnlock, useUnlockStore } from "@warmdock/app";
import type { UnlockNodeState } from "@warmdock/core/types";
import { formatPoints } from "@warmdock/core/rules/points";
import { ABILITY_COPY } from "./abilityCopy";
import { renderUnlockIcon } from "./UnlockNode";
import { findLayout, getUnlockTreeLayout, type IconKey } from "./unlockTreeLayout";
import { useHoldToActivate } from "./useHoldToActivate";

const HOLD_DURATION_MS = 2000;

/** 能力頁的三條分支(覺醒後可見;Core 只在首次進來當觸發,不佔版面)。 */
type AreaKey = "capacity" | "today" | "review";

const AREA_NODES: Record<AreaKey, string[]> = {
  capacity: ["slots.4", "slots.5", "slots.6", "slots.7"],
  today: ["focus.basic", "time.custom_refresh"],
  review: ["analysis.weekly"],
};

const AREA_META: Record<AreaKey, { title: string; subtitle: string; icon: IconKey }> = {
  capacity: { title: "Capacity", subtitle: "4 → 5 → 6 → 7 slots", icon: "grid6" },
  today: { title: "Today", subtitle: "Focus + Rhythm", icon: "star" },
  review: { title: "Review", subtitle: "Weekly analysis", icon: "bars" },
};

type RowState =
  | "unlocked"
  | "awakenable"
  | "awaiting"
  | "blocked"
  | "insufficient"
  | "purchasable";

const STATE_LABEL: Record<RowState, string> = {
  unlocked: "Unlocked",
  awakenable: "Dormant",
  awaiting: "Locked",
  blocked: "Needs the one before",
  insufficient: "Not enough points",
  purchasable: "Ready",
};

function deriveRowState(
  node: UnlockNodeState | undefined,
  isRoot: boolean,
  isRootAwakened: boolean
): RowState {
  if (!node) return isRootAwakened ? "blocked" : "awaiting";
  if (node.unlocked) return "unlocked";
  if (isRoot) return "awakenable";
  if (!isRootAwakened) return "awaiting";
  if (!node.requirementsMet) return "blocked";
  if (!node.affordable) return "insufficient";
  return "purchasable";
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const isHoldable = (s: RowState) => s === "purchasable" || s === "awakenable";
const isLockedLook = (s: RowState) =>
  s === "awaiting" || s === "blocked" || s === "insufficient";

/**
 * 能力配置頁(橫式 / 頁中頁版)。書本第 2 頁。
 * 未覺醒:整頁一張「Awaken」hero(長按覺醒)——Core 只在這時出現。
 * 覺醒後:總覽 = Capacity 主卡 + Today/Review 兩張小卡 + 建議列;
 *         點卡鑽進該分支內頁(‹ Back 返回)。
 * 沿用節點狀態、長按解鎖、購買流程;文案改用英文 ABILITY_COPY。
 */
export function AbilitiesPage() {
  const progress = useUnlockStore((s) => s.progress);

  useEffect(() => {
    void loadUnlockProgress();
  }, []);

  const layoutNodes = getUnlockTreeLayout("compact").nodes;
  const nodeStates = progress?.nodes ?? [];
  const available = progress?.availablePoints ?? 0;
  const isRootAwakened =
    nodeStates.find((n) => n.nodeId === "root.awaken")?.unlocked ?? false;

  const [drawer, setDrawer] = useState<AreaKey | null>(null);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);

  // ---- 長按解鎖(全頁共用一個 hook,activeHoldNodeId 區分目標) ----
  const [activeHoldNodeId, setActive] = useState<string | null>(null);
  const [confirmNodeId, setConfirm] = useState<string | null>(null);
  const [purchasingId, setPurchasing] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    activeRef.current = activeHoldNodeId;
  }, [activeHoldNodeId]);

  const { progress: holdProgress, handlers, reset } = useHoldToActivate({
    durationMs: HOLD_DURATION_MS,
    enabled: true,
    onComplete: () => {
      const id = activeRef.current;
      if (!id) return;
      setConfirm(id);
      setActive(null);
    },
  });

  const stateOf = (nodeId: string): RowState =>
    deriveRowState(
      nodeStates.find((n) => n.nodeId === nodeId),
      nodeId === "root.awaken",
      isRootAwakened
    );
  const costOf = (nodeId: string): number =>
    nodeStates.find((n) => n.nodeId === nodeId)?.cost ?? 0;
  const iconOf = (nodeId: string): IconKey =>
    (findLayout(nodeId, layoutNodes)?.icon ?? "sparkle") as IconKey;

  const beginHold =
    (nodeId: string, kind: "mouse" | "touch") => (e: React.MouseEvent) => {
      if (activeHoldNodeId && activeHoldNodeId !== nodeId) reset();
      setActive(nodeId);
      if (kind === "mouse") handlers.onMouseDown(e);
      else handlers.onTouchStart();
    };
  const endHold = (nodeId: string) => () => {
    handlers.onMouseUp();
    if (activeHoldNodeId === nodeId) setActive(null);
  };
  const leaveHold = (nodeId: string) => () => {
    handlers.onMouseLeave();
    if (activeHoldNodeId === nodeId) setActive(null);
  };
  const bind = (nodeId: string, holdable: boolean): HoldProps => ({
    holdable,
    holdProgress: activeHoldNodeId === nodeId ? holdProgress : 0,
    onHoldMouseDown: beginHold(nodeId, "mouse"),
    onHoldTouchStart: beginHold(nodeId, "touch"),
    onHoldUp: endHold(nodeId),
    onHoldLeave: leaveHold(nodeId),
  });

  const handlePurchase = async (nodeId: string) => {
    if (purchasingId) return;
    setPurchasing(nodeId);
    try {
      await purchaseUnlock(nodeId);
      setConfirm(null);
    } catch {
      // 錯誤寫進 unlockStore.error;保留 modal 讓使用者重試/取消
    } finally {
      setPurchasing(null);
    }
  };

  const unlockedCount = (area: AreaKey) =>
    AREA_NODES[area].filter((id) => stateOf(id) === "unlocked").length;

  // 建議下一步:第一個可解鎖;否則第一個只差點數的。
  const suggestion = (() => {
    const flat = (["capacity", "today", "review"] as AreaKey[]).flatMap((a) =>
      AREA_NODES[a].map((id) => [a, id] as const)
    );
    const ready = flat.find(([, id]) => stateOf(id) === "purchasable");
    if (ready) return { area: ready[0], text: `${ABILITY_COPY[ready[1]].name} is ready.` };
    const soon = flat.find(([, id]) => stateOf(id) === "insufficient");
    if (soon)
      return {
        area: soon[0],
        text: `Earn ◆${costOf(soon[1])} for ${ABILITY_COPY[soon[1]].name}.`,
      };
    return { area: "capacity" as AreaKey, text: "Every ability is yours." };
  })();

  // ---------- render ----------
  if (!isRootAwakened) {
    const s = stateOf("root.awaken");
    return (
      <div className="wd-panel__body wd-ab wd-ab--hero">
        <div className="wd-ab__head">
          <span className="wd-ab__title">Abilities</span>
          <span className="wd-points-chip">
            <span className="wd-points-chip__icon">◆</span>
            {formatPoints(available)}
          </span>
        </div>
        <AwakenHero {...bind("root.awaken", isHoldable(s))} />
        <ConfirmModal
          confirmNodeId={confirmNodeId}
          available={available}
          costOf={costOf}
          purchasingId={purchasingId}
          onCancel={() => setConfirm(null)}
          onConfirm={handlePurchase}
        />
      </div>
    );
  }

  return (
    <div className="wd-panel__body wd-ab">
      {drawer === null ? (
        <>
          <div className="wd-ab__head">
            <span className="wd-ab__title">Abilities</span>
            <span className="wd-ab__awake" title="System awakened">
              ✦
            </span>
            <span className="wd-points-chip">
              <span className="wd-points-chip__icon">◆</span>
              {formatPoints(available)}
            </span>
          </div>

          {/* Capacity = 主分支,寬卡 + 進度 pip */}
          <button
            type="button"
            className="wd-ab__feature"
            onClick={() => setDrawer("capacity")}
          >
            <span className="wd-ab__feature-icon" aria-hidden>
              <svg viewBox="0 0 56 56" width="30" height="30">
                {renderUnlockIcon("grid6", false)}
              </svg>
            </span>
            <span className="wd-ab__feature-text">
              <span className="wd-ab__feature-title">Capacity</span>
              <span className="wd-ab__pips" aria-hidden>
                {AREA_NODES.capacity.map((id) => (
                  <span
                    key={id}
                    className={`wd-ab__pip ${
                      stateOf(id) === "unlocked" ? "is-on" : ""
                    }`}
                  />
                ))}
              </span>
            </span>
            <span className="wd-ab__feature-go">{unlockedCount("capacity")}/4 ›</span>
          </button>

          {/* Today + Review 兩張小卡 */}
          <div className="wd-ab__row">
            {(["today", "review"] as AreaKey[]).map((area) => (
              <AreaCard
                key={area}
                meta={AREA_META[area]}
                unlocked={unlockedCount(area)}
                total={AREA_NODES[area].length}
                onOpen={() => setDrawer(area)}
              />
            ))}
          </div>

          <button
            type="button"
            className="wd-ab__suggest"
            onClick={() => setDrawer(suggestion.area)}
          >
            <span className="wd-ab__suggest-label">Next</span>
            <span className="wd-ab__suggest-text">{suggestion.text}</span>
            <span className="wd-ab__suggest-go">›</span>
          </button>
        </>
      ) : (
        <>
          <div className="wd-ab__inner-head">
            <button
              type="button"
              className="wd-ab__back"
              onClick={() => setDrawer(null)}
            >
              ‹ Back
            </button>
            <span className="wd-ab__inner-title">{AREA_META[drawer].title}</span>
            <span className="wd-points-chip">
              <span className="wd-points-chip__icon">◆</span>
              {formatPoints(available)}
            </span>
          </div>

          {drawer === "capacity" &&
            (() => {
              const chain = AREA_NODES.capacity;
              const selId =
                selectedCap && chain.includes(selectedCap)
                  ? selectedCap
                  : (chain.find((id) => stateOf(id) !== "unlocked") ??
                    chain[chain.length - 1]);
              const selState = stateOf(selId);
              return (
                <>
                  <div className="wd-ab__chain">
                    {chain.map((id) => {
                      const s = stateOf(id);
                      return (
                        <NodeTile
                          key={id}
                          icon={iconOf(id)}
                          rowState={s}
                          cost={costOf(id)}
                          selected={id === selId}
                          onSelect={() => setSelectedCap(id)}
                          {...bind(id, isHoldable(s))}
                        />
                      );
                    })}
                  </div>
                  <div className="wd-ab__detail">
                    <div className="wd-ab__detail-main">
                      <span className="wd-ab__detail-name">
                        {ABILITY_COPY[selId].name}
                      </span>
                      <span className="wd-ab__detail-desc">
                        {ABILITY_COPY[selId].tagline}
                      </span>
                    </div>
                    <div className="wd-ab__detail-right">
                      <StateMark rowState={selState} cost={costOf(selId)} />
                    </div>
                  </div>
                  <p className="wd-ab__hint">Hold a ready node for 2s to unlock</p>
                </>
              );
            })()}

          {drawer === "today" && (
            <div className="wd-ab__pair">
              {AREA_NODES.today.map((id) => {
                const s = stateOf(id);
                return (
                  <BigCard
                    key={id}
                    nodeId={id}
                    icon={iconOf(id)}
                    rowState={s}
                    cost={costOf(id)}
                    {...bind(id, isHoldable(s))}
                  />
                );
              })}
            </div>
          )}

          {drawer === "review" &&
            (() => {
              const id = AREA_NODES.review[0];
              const s = stateOf(id);
              return (
                <div className="wd-ab__single">
                  <BigCard
                    nodeId={id}
                    icon={iconOf(id)}
                    rowState={s}
                    cost={costOf(id)}
                    {...bind(id, isHoldable(s))}
                  />
                  <p className="wd-ab__single-note">{ABILITY_COPY[id].description}</p>
                </div>
              );
            })()}
        </>
      )}

      <ConfirmModal
        confirmNodeId={confirmNodeId}
        available={available}
        costOf={costOf}
        purchasingId={purchasingId}
        onCancel={() => setConfirm(null)}
        onConfirm={handlePurchase}
      />
    </div>
  );
}

// ---------- 子元件 ----------

type HoldProps = {
  holdable: boolean;
  holdProgress: number;
  onHoldMouseDown: (e: React.MouseEvent) => void;
  onHoldTouchStart: (e: React.MouseEvent) => void;
  onHoldUp: () => void;
  onHoldLeave: () => void;
};

function holdEvents(p: HoldProps) {
  if (!p.holdable) return {};
  return {
    onMouseDown: p.onHoldMouseDown,
    onMouseUp: p.onHoldUp,
    onMouseLeave: p.onHoldLeave,
    onTouchStart: p.onHoldTouchStart as unknown as React.TouchEventHandler,
    onTouchEnd: p.onHoldUp,
  };
}

/** 鎖頭徽章(掛在未解鎖節點上;user 點子)。 */
function LockBadge() {
  return (
    <svg className="wd-ab__lock" viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path
        d="M5 7.5 V5.2 a3 3 0 0 1 6 0 V7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect x="3.4" y="7.3" width="9.2" height="6.4" rx="1.4" fill="currentColor" />
    </svg>
  );
}

/** 狀態徽記:解鎖✓ / 可解鎖•ready / 其餘🔒 + 狀態字。 */
function StateMark({ rowState, cost }: { rowState: RowState; cost: number }) {
  if (rowState === "unlocked")
    return <span className="wd-ab__done">✓ Unlocked</span>;
  if (rowState === "purchasable" || rowState === "awakenable")
    return (
      <>
        <span className="wd-ab__cost">◆ {cost}</span>
        <span className="wd-ab__ready">Ready</span>
      </>
    );
  return (
    <>
      {cost > 0 && <span className="wd-ab__cost">◆ {cost}</span>}
      <span className="wd-ab__state">
        <LockBadge /> {STATE_LABEL[rowState]}
      </span>
    </>
  );
}

function AwakenHero(hold: HoldProps) {
  const copy = ABILITY_COPY["root.awaken"];
  const pct = Math.round(clamp01(hold.holdProgress) * 100);
  return (
    <div className="wd-ab__hero-card" data-holdable="true" {...holdEvents(hold)}>
      {pct > 0 && (
        <span className="wd-ab__hero-fill" style={{ height: `${pct}%` }} aria-hidden />
      )}
      <span className="wd-ab__hero-icon" aria-hidden>
        <svg viewBox="0 0 56 56" width="40" height="40">
          {renderUnlockIcon("sparkle", false)}
        </svg>
      </span>
      <span className="wd-ab__hero-name">{copy.name}</span>
      <span className="wd-ab__hero-tag">{copy.tagline}</span>
      <span className="wd-ab__hero-cta">Hold to awaken</span>
    </div>
  );
}

function AreaCard({
  meta,
  unlocked,
  total,
  onOpen,
}: {
  meta: { title: string; subtitle: string; icon: IconKey };
  unlocked: number;
  total: number;
  onOpen: () => void;
}) {
  const done = unlocked >= total;
  return (
    <button type="button" className="wd-ab__area" onClick={onOpen}>
      <span className="wd-ab__area-icon" aria-hidden>
        <svg viewBox="0 0 56 56" width="26" height="26">
          {renderUnlockIcon(meta.icon, false)}
        </svg>
      </span>
      <span className="wd-ab__area-title">{meta.title}</span>
      <span className="wd-ab__area-status">
        {done ? "✓" : `${unlocked}/${total}`}
      </span>
    </button>
  );
}

function NodeTile({
  icon,
  rowState,
  cost,
  selected,
  onSelect,
  ...hold
}: {
  icon: IconKey;
  rowState: RowState;
  cost: number;
  selected: boolean;
  onSelect: () => void;
} & HoldProps) {
  const dim = isLockedLook(rowState);
  const pct = Math.round(clamp01(hold.holdProgress) * 100);
  return (
    <div
      className="wd-ab__node"
      data-state={rowState}
      data-selected={selected ? "true" : undefined}
      data-holdable={hold.holdable ? "true" : undefined}
      onClick={onSelect}
      {...holdEvents(hold)}
    >
      {pct > 0 && (
        <span className="wd-ab__node-hold" style={{ height: `${pct}%` }} aria-hidden />
      )}
      {dim && (
        <span className="wd-ab__node-lock" aria-hidden>
          <LockBadge />
        </span>
      )}
      {rowState === "unlocked" && (
        <span className="wd-ab__node-seal" aria-hidden>
          ✓
        </span>
      )}
      <span className="wd-ab__node-icon" aria-hidden>
        <svg viewBox="0 0 56 56" width="26" height="26">
          {renderUnlockIcon(icon, dim)}
        </svg>
      </span>
      <span className="wd-ab__node-cost">◆{cost}</span>
    </div>
  );
}

function BigCard({
  nodeId,
  icon,
  rowState,
  cost,
  ...hold
}: {
  nodeId: string;
  icon: IconKey;
  rowState: RowState;
  cost: number;
} & HoldProps) {
  const copy = ABILITY_COPY[nodeId];
  const dim = isLockedLook(rowState);
  const pct = Math.round(clamp01(hold.holdProgress) * 100);
  return (
    <div
      className="wd-ab__card"
      data-state={rowState}
      data-holdable={hold.holdable ? "true" : undefined}
      {...holdEvents(hold)}
    >
      {pct > 0 && (
        <span className="wd-ab__card-hold" style={{ width: `${pct}%` }} aria-hidden />
      )}
      <span className="wd-ab__card-top">
        <span className="wd-ab__card-icon" aria-hidden>
          <svg viewBox="0 0 56 56" width="28" height="28">
            {renderUnlockIcon(icon, dim)}
          </svg>
        </span>
        {dim && <LockBadge />}
        {rowState === "unlocked" && <span className="wd-ab__node-seal">✓</span>}
      </span>
      <span className="wd-ab__card-name">{copy.name}</span>
      <span className="wd-ab__card-mantra">{copy.tagline}</span>
      <span className="wd-ab__card-foot">
        <StateMark rowState={rowState} cost={cost} />
      </span>
    </div>
  );
}

function ConfirmModal({
  confirmNodeId,
  available,
  costOf,
  purchasingId,
  onCancel,
  onConfirm,
}: {
  confirmNodeId: string | null;
  available: number;
  costOf: (id: string) => number;
  purchasingId: string | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!confirmNodeId) return null;
  const copy = ABILITY_COPY[confirmNodeId];
  const isRoot = confirmNodeId === "root.awaken";
  const cost = costOf(confirmNodeId);
  const after = Math.max(0, available - cost);
  const busy = purchasingId === confirmNodeId;
  return (
    <div
      className="wd-overlay"
      style={{ zIndex: 80 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="wd-modal wd-ab__confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="wd-modal__title">
          {isRoot ? "Awaken?" : `Unlock “${copy.name}”?`}
        </h2>
        <p className="wd-modal__subtitle">{copy.description}</p>
        <ul className="wd-ab__confirm-effects">
          {copy.effects.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {!isRoot && (
          <div className="wd-ab__confirm-cost">
            <span>
              Cost <b>◆{cost}</b>
            </span>
            <span>
              Left <b>◆{after}</b>
            </span>
          </div>
        )}
        <div className="wd-ab__confirm-actions">
          <button
            type="button"
            className="wd-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            onClick={() => onConfirm(confirmNodeId)}
            disabled={busy}
          >
            {busy ? "…" : isRoot ? "Awaken" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}
