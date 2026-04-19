import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useUnlockStore } from "../../store/useUnlockStore";
import {
  TREE_LAYOUT,
  TREE_VIEWBOX,
  findLayout,
  NODE_SIZE,
  CENTER_SIZE,
} from "./unlockTreeLayout";
import { UnlockNode } from "./UnlockNode";
import { UnlockTooltip } from "./UnlockTooltip";
import { UnlockAwakenBurst } from "./UnlockAwakenBurst";
import { UnlockHoldConfirmModal } from "./UnlockHoldConfirmModal";
import { useHoldToActivate } from "./useHoldToActivate";
import { purchaseAndSyncUnlock } from "../../services/rewardService";
import { formatPoints } from "../../lib/points";

const HOVER_CLEAR_DELAY_MS = 0;
const HOLD_DURATION_MS = 2000;
const CURVED_TARGETS = new Set(["slots.5", "slots.6", "slots.7"]);

function svgToPanel(
  svgX: number,
  svgY: number,
  svgRect: { width: number; height: number },
  svgOffset: { x: number; y: number }
): { x: number; y: number } {
  const scaleX = svgRect.width / TREE_VIEWBOX.w;
  const scaleY = svgRect.height / TREE_VIEWBOX.h;
  const scale = Math.min(scaleX, scaleY);

  const actualW = TREE_VIEWBOX.w * scale;
  const actualH = TREE_VIEWBOX.h * scale;
  const padX = (svgRect.width - actualW) / 2;
  const padY = (svgRect.height - actualH) / 2;

  return {
    x: svgOffset.x + padX + svgX * scale,
    y: svgOffset.y + padY + svgY * scale,
  };
}

export function UnlockTree() {
  const isOpen = useUIStore((s) => s.isUnlockTreeOpen);
  const closeUnlockTree = useUIStore((s) => s.closeUnlockTree);
  const progress = useUnlockStore((s) => s.progress);
  const loadProgress = useUnlockStore((s) => s.loadProgress);

  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [confirmNodeId, setConfirmNodeId] = useState<string | null>(null);
  const [activeHoldNodeId, setActiveHoldNodeId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgMetrics, setSvgMetrics] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 });

  const remeasure = () => {
    if (!panelRef.current || !svgContainerRef.current) return;
    const panelRect = panelRef.current.getBoundingClientRect();
    const svgRect = svgContainerRef.current.getBoundingClientRect();
    setSvgMetrics({
      width: svgRect.width,
      height: svgRect.height,
      offsetX: svgRect.left - panelRect.left,
      offsetY: svgRect.top - panelRect.top,
    });
    setPanelSize({ w: panelRect.width, h: panelRect.height });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    remeasure();
    const ro = new ResizeObserver(remeasure);
    if (panelRef.current) ro.observe(panelRef.current);
    if (svgContainerRef.current) ro.observe(svgContainerRef.current);
    window.addEventListener("resize", remeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [isOpen]);

  const clearTimerRef = useRef<number | null>(null);
  const cancelClear = () => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  };
  const scheduleClear = () => {
    cancelClear();
    clearTimerRef.current = window.setTimeout(() => {
      setHoverNodeId(null);
      setPurchaseError(null);
      clearTimerRef.current = null;
    }, HOVER_CLEAR_DELAY_MS);
  };

  useEffect(() => {
    if (isOpen) {
      loadProgress();
      setPurchaseError(null);
      setHoverNodeId(null);
      setConfirmNodeId(null);
      setActiveHoldNodeId(null);
      cancelClear();
    }
    return () => cancelClear();
  }, [isOpen, loadProgress]);

  const nodes = progress?.nodes ?? [];
  const rootState = nodes.find((n) => n.node_id === "root.awaken");
  const isRootAwakened = rootState?.unlocked ?? false;
  const available = progress?.available_points ?? 0;

  // 永遠 enabled,由 mousedown 處理器自己把關 canHold
  const {
    progress: holdProgress,
    handlers: holdHandlers,
    reset: resetHold,
  } = useHoldToActivate({
    durationMs: HOLD_DURATION_MS,
    enabled: true,
    onComplete: () => {
      // 用 ref 讀當下的 activeHoldNodeId,避免閉包陳舊值
      const nodeId = activeHoldNodeIdRef.current;
      if (!nodeId) return;
      setConfirmNodeId(nodeId);
      setActiveHoldNodeId(null);
    },
  });

  // 給 onComplete 閉包用的 ref,永遠拿到最新值
  const activeHoldNodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeHoldNodeIdRef.current = activeHoldNodeId;
  }, [activeHoldNodeId]);

  const canHold = (nodeId: string): boolean => {
    const state = nodes.find((n) => n.node_id === nodeId);
    if (!state || state.unlocked) return false;

    const isCenter = nodeId === "root.awaken";
    if (isCenter) {
      return !state.unlocked;
    }

    return isRootAwakened && state.requirements_met && state.affordable;
  };

  const handlePurchase = async (nodeId: string) => {
    if (purchasingId) return;
    setPurchasingId(nodeId);
    setPurchaseError(null);
    try {
      await purchaseAndSyncUnlock(nodeId);
      if (nodeId === "root.awaken") {
        setBurstActive(true);
      }
      setConfirmNodeId(null);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : String(err));
    } finally {
      setPurchasingId(null);
    }
  };

  const hoveredNode = hoverNodeId
    ? nodes.find((n) => n.node_id === hoverNodeId)
    : null;
  const hoveredLayout = hoverNodeId ? findLayout(hoverNodeId) : null;

  let anchor: { x: number; y: number; halfW: number; halfH: number } | null =
    null;
  if (hoveredLayout && svgMetrics.width > 0) {
    const panelCoord = svgToPanel(
      hoveredLayout.x,
      hoveredLayout.y,
      { width: svgMetrics.width, height: svgMetrics.height },
      { x: svgMetrics.offsetX, y: svgMetrics.offsetY }
    );
    const nodeLogicalSize =
      hoveredLayout.node_id === "root.awaken" ? CENTER_SIZE : NODE_SIZE;
    const nodeScreenHalf = nodeLogicalSize / 2;
    anchor = {
      x: panelCoord.x,
      y: panelCoord.y,
      halfW: nodeScreenHalf,
      halfH: nodeScreenHalf,
    };
  }

  if (!isOpen) return null;

  const confirmLayout = confirmNodeId ? findLayout(confirmNodeId) : null;
  const confirmState = confirmNodeId
    ? nodes.find((n) => n.node_id === confirmNodeId)
    : null;

  return (
	  <div
	    className="wd-unlock-tree-overlay"
	    onMouseDown={(e) => {
	  	if (e.target === e.currentTarget) closeUnlockTree();
	    }}
	  >
      <div className="wd-unlock-tree-card" ref={panelRef}>
        <div className="wd-unlock-tree-header">
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--wd-ink)" }}>
            能力配置
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 16,
              color: "var(--wd-ink)",
              marginRight: 14,
            }}
          >
            <span style={{ color: "var(--wd-gold)" }}>◆</span>{" "}
            <span style={{ fontWeight: 700 }}>{formatPoints(available)}</span>
          </span>
          <button
            type="button"
            className="wd-btn"
            style={{ fontSize: 15, padding: "6px 14px" }}
            onClick={closeUnlockTree}
          >
            ✕
          </button>
        </div>

        <div
          ref={svgContainerRef}
          style={{ flex: 1, position: "relative", minHeight: 0 }}
        >
          <svg
            viewBox={`0 0 ${TREE_VIEWBOX.w} ${TREE_VIEWBOX.h}`}
            style={{ width: "100%", height: "100%" }}
            preserveAspectRatio="xMidYMid meet"
          >
            {TREE_LAYOUT.filter((n) => n.node_id !== "root.awaken").map((n) => {
              const center = TREE_LAYOUT[0];
              const nodeState = nodes.find((s) => s.node_id === n.node_id);
              const parentId = findParentInChain(n.node_id);
              const parentLayout = parentId ? findLayout(parentId) : center;
              const parentState = parentId
                ? nodes.find((s) => s.node_id === parentId)
                : rootState;

              const fromX = parentLayout?.x ?? center.x;
              const fromY = parentLayout?.y ?? center.y;

              const parentUnlocked = parentState?.unlocked ?? false;
              const selfUnlocked = nodeState?.unlocked ?? false;
              const solid = parentUnlocked && selfUnlocked;

              const strokeColor = solid
                ? "var(--wd-border)"
                : parentUnlocked
                ? "var(--wd-border)"
                : "var(--wd-border-soft)";
              const dash = solid ? undefined : "4 6";
              const opacity = parentUnlocked ? 1 : 0.4;

              if (CURVED_TARGETS.has(n.node_id)) {
                const midX = (fromX + n.x) / 2;
                const midY = (fromY + n.y) / 2;
                const dx = n.x - fromX;
                const dy = n.y - fromY;
                const offset = 60;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const perpX = -dy / len;
                const perpY = dx / len;
                const side = n.node_id === "slots.5" ? -1 : 1;
                const cx = midX + perpX * offset * side;
                const cy = midY + perpY * offset * side;

                return (
                  <path
                    key={`line-${n.node_id}`}
                    d={`M ${fromX} ${fromY} Q ${cx} ${cy} ${n.x} ${n.y}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeDasharray={dash}
                    opacity={opacity}
                  />
                );
              }

              return (
                <line
                  key={`line-${n.node_id}`}
                  x1={fromX}
                  y1={fromY}
                  x2={n.x}
                  y2={n.y}
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeDasharray={dash}
                  opacity={opacity}
                />
              );
            })}

            {burstActive && (
              <UnlockAwakenBurst onDone={() => setBurstActive(false)} />
            )}

            {TREE_LAYOUT.map((layout) => {
              const state = nodes.find((s) => s.node_id === layout.node_id);
              if (!state) return null;
              const isCenter = layout.node_id === "root.awaken";

              const nodeHoldProgress =
                activeHoldNodeId === layout.node_id ? holdProgress : 0;

              return (
                <UnlockNode
                  key={layout.node_id}
                  nodeId={layout.node_id}
                  x={layout.x}
                  y={layout.y}
                  icon={layout.icon}
                  state={state}
                  isCenter={isCenter}
                  isRootAwakened={isRootAwakened}
                  onHoverEnter={() => {
                    cancelClear();
                    setHoverNodeId(layout.node_id);
                    setPurchaseError(null);
                  }}
                  onHoverLeave={() => {
                    scheduleClear();
                  }}
                  holdProgress={nodeHoldProgress}
                  // 永遠開,由下方 handler 自己判斷 canHold
                  holdEnabled={true}
                  onHoldMouseDown={(e) => {
                    // mousedown 當下才檢查
                    if (!canHold(layout.node_id)) return;
                    if (activeHoldNodeId && activeHoldNodeId !== layout.node_id) {
                      resetHold();
                    }
                    setActiveHoldNodeId(layout.node_id);
                    holdHandlers.onMouseDown(e);
                  }}
                  onHoldMouseUp={() => {
                    holdHandlers.onMouseUp();
                    if (activeHoldNodeId === layout.node_id) {
                      setActiveHoldNodeId(null);
                    }
                  }}
                  onHoldMouseLeave={() => {
                    holdHandlers.onMouseLeave();
                    if (activeHoldNodeId === layout.node_id) {
                      setActiveHoldNodeId(null);
                    }
                  }}
                />
              );
            })}

            {!isRootAwakened && (
              <text
                x={TREE_VIEWBOX.w / 2}
                y={TREE_VIEWBOX.h - 30}
                textAnchor="middle"
                fontFamily="var(--wd-font-body)"
                fontSize="18"
                fill="var(--wd-orange)"
              >
                按住中心 2 秒覺醒
              </text>
            )}
          </svg>
        </div>

        {hoveredNode && hoveredLayout && anchor && panelSize.w > 0 && (
          <UnlockTooltip
            key={hoveredNode.node_id}
            layout={hoveredLayout}
            state={hoveredNode}
            availablePoints={available}
            isRootAwakened={isRootAwakened}
            isCenter={hoveredNode.node_id === "root.awaken"}
            purchaseError={purchaseError}
            onMouseEnter={cancelClear}
            onMouseLeave={scheduleClear}
            anchor={anchor}
            panelRect={panelSize}
          />
        )}
      </div>

      {confirmNodeId && confirmLayout && confirmState && (
        <UnlockHoldConfirmModal
          layout={confirmLayout}
          cost={confirmState.cost}
          availablePoints={available}
          isPurchasing={purchasingId === confirmNodeId}
          onConfirm={() => {
            void handlePurchase(confirmNodeId);
          }}
          onCancel={() => {
            if (purchasingId === confirmNodeId) return;
            setConfirmNodeId(null);
            setPurchaseError(null);
          }}
        />
      )}
    </div>
  );
}

function findParentInChain(nodeId: string): string | null {
  if (nodeId === "slots.5") return "slots.4";
  if (nodeId === "slots.6") return "slots.5";
  if (nodeId === "slots.7") return "slots.6";
  if (
    nodeId === "slots.4" ||
    nodeId === "focus.basic" ||
    nodeId === "time.custom_refresh" ||
    nodeId === "analysis.weekly"
  ) {
    return "root.awaken";
  }
  return null;
}