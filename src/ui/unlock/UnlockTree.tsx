import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  loadUnlockProgress,
  purchaseUnlock,
} from "../../app/orchestrators/unlocks";
import {
  closeUnlockTree,
  collapsePanelFromUnlock,
  maximizeUnlockTree,
  restoreUnlockTree,
} from "../../app/orchestrators/windowFlow";
import { useSettingsStore } from "../../app/stores/settingsStore";
import { useUIStore } from "../../app/stores/uiStore";
import { useUnlockStore } from "../../app/stores/unlockStore";
import { t } from "../../core/i18n";
import { formatPoints } from "../../core/rules/points";
import { UnlockAwakenBurst } from "./UnlockAwakenBurst";
import { UnlockHoldConfirmModal } from "./UnlockHoldConfirmModal";
import { UnlockNode } from "./UnlockNode";
import { UnlockTooltip } from "./UnlockTooltip";
import { findLayout, getUnlockTreeLayout } from "./unlockTreeLayout";
import { useHoldToActivate } from "./useHoldToActivate";

const HOVER_CLEAR_DELAY_MS = 0;
const HOLD_DURATION_MS = 2000;
// 直式布局改用直線連接(舊的曲線 offset 是為 landscape viewBox 調的)
const CURVED_TARGETS = new Set<string>();

function svgToPanel(
  svgX: number,
  svgY: number,
  svgRect: { width: number; height: number },
  svgOffset: { x: number; y: number },
  viewBox: { w: number; h: number }
): { x: number; y: number; scale: number } {
  const scaleX = svgRect.width / viewBox.w;
  const scaleY = svgRect.height / viewBox.h;
  const scale = Math.min(scaleX, scaleY);

  const actualW = viewBox.w * scale;
  const actualH = viewBox.h * scale;
  const padX = (svgRect.width - actualW) / 2;
  const padY = (svgRect.height - actualH) / 2;

  return {
    x: svgOffset.x + padX + svgX * scale,
    y: svgOffset.y + padY + svgY * scale,
    scale,
  };
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

export function UnlockTree() {
  const isOpen = useUIStore((s) => s.isUnlockTreeOpen);
  const isClosing = useUIStore((s) => s.isUnlockTreeClosing);
  const isMaximized = useUIStore((s) => s.isUnlockMaximized);
  const isPinned = useSettingsStore((s) => s.settings?.pinEnabled ?? false);
  const progress = useUnlockStore((s) => s.progress);
  const tree = getUnlockTreeLayout(isMaximized ? "expanded" : "compact");
  const treeLayout = tree.nodes;
  const treeViewBox = tree.viewBox;

  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [confirmNodeId, setConfirmNodeId] = useState<string | null>(null);
  const [activeHoldNodeId, setActiveHoldNodeId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgMetrics, setSvgMetrics] = useState({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 });
  // 第三頁面(放大)說明卡跟隨滑鼠用的游標座標(卡片 padding box 內)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const remeasure = () => {
    const panel = panelRef.current;
    const field = svgContainerRef.current;
    if (!panel || !field) return;
    // 用 layout 度量(offset*)而非 getBoundingClientRect:後者會被卡片的
    // 翻書 rotateY / 淡出 scale 等 CSS transform 扭曲,且 ResizeObserver 不會
    // 因 transform 觸發,導致動畫中量到的錯誤尺寸卡住 → 說明卡寬度算錯而變形。
    // field 的 offsetParent 是卡片(position:fixed),offsetLeft/Top 即它在卡片
    // padding box 內的座標,正好對應絕對定位的 tooltip。
    setSvgMetrics({
      width: field.offsetWidth,
      height: field.offsetHeight,
      offsetX: field.offsetLeft,
      offsetY: field.offsetTop,
    });
    setPanelSize({ w: panel.offsetWidth, h: panel.offsetHeight });
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
    // isMaximized 改變時視窗尺寸會變,重新量測 tooltip 定位用的座標
  }, [isOpen, isMaximized]);

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

  // Panel 是條件式 mount(isUnlockTreeOpen && <UnlockTree />),
  // hover/confirm 等 state 在每次開啟時本來就是初始值
  useEffect(() => {
    if (isOpen) {
      void loadUnlockProgress();
    }
    return () => cancelClear();
  }, [isOpen]);

  const nodes = progress?.nodes ?? [];
  const rootState = nodes.find((n) => n.nodeId === "root.awaken");
  const isRootAwakened = rootState?.unlocked ?? false;
  const available = progress?.availablePoints ?? 0;

  // 給 onComplete 閉包用的 ref,永遠拿到最新值
  const activeHoldNodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeHoldNodeIdRef.current = activeHoldNodeId;
  }, [activeHoldNodeId]);

  const {
    progress: holdProgress,
    handlers: holdHandlers,
    reset: resetHold,
  } = useHoldToActivate({
    durationMs: HOLD_DURATION_MS,
    enabled: true,
    onComplete: () => {
      const nodeId = activeHoldNodeIdRef.current;
      if (!nodeId) return;
      setConfirmNodeId(nodeId);
      setActiveHoldNodeId(null);
    },
  });

  const canHold = (nodeId: string): boolean => {
    const state = nodes.find((n) => n.nodeId === nodeId);
    if (!state || state.unlocked) return false;

    if (nodeId === "root.awaken") return !state.unlocked;
    return isRootAwakened && state.requirementsMet && state.affordable;
  };

  const handlePurchase = async (nodeId: string) => {
    if (purchasingId) return;
    setPurchasingId(nodeId);
    setPurchaseError(null);
    try {
      await purchaseUnlock(nodeId);
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
    ? nodes.find((n) => n.nodeId === hoverNodeId)
    : null;
  const hoveredLayout = hoverNodeId
    ? findLayout(hoverNodeId, treeLayout)
    : null;

  let anchor: { x: number; y: number; halfW: number; halfH: number } | null =
    null;
  if (hoveredLayout && svgMetrics.width > 0) {
    const panelCoord = svgToPanel(
      hoveredLayout.x,
      hoveredLayout.y,
      { width: svgMetrics.width, height: svgMetrics.height },
      { x: svgMetrics.offsetX, y: svgMetrics.offsetY },
      treeViewBox
    );
    const nodeLogicalSize =
      hoveredLayout.node_id === "root.awaken" ? tree.centerSize : tree.nodeSize;
    anchor = {
      x: panelCoord.x,
      y: panelCoord.y,
      halfW: (nodeLogicalSize * panelCoord.scale) / 2,
      halfH: (nodeLogicalSize * panelCoord.scale) / 2,
    };
  }

  const confirmLayout = confirmNodeId
    ? findLayout(confirmNodeId, treeLayout)
    : null;
  const confirmState = confirmNodeId
    ? nodes.find((n) => n.nodeId === confirmNodeId)
    : null;

  return (
    <>
      {/* 全螢幕 backdrop:未放大時點任何空白處(含首頁)即直接收合成右緣泡泡
          (連同首頁一起收掉,不只是回到首頁)。放大時 backdrop 仍擋住點擊但不
          關閉,改用 ✕/縮回。
          關閉動畫進行中(isClosing)不渲染 backdrop —— 否則它仍蓋在首頁上方,
          翻書那 0.5 秒內點首頁會被 backdrop 攔截而誤收成泡泡。 */}
      {!isClosing && (
        <div
          className="wd-unlock-backdrop"
          onMouseDown={() => {
            if (!isMaximized && !isPinned) void collapsePanelFromUnlock();
          }}
        />
      )}
      <div
        className="wd-unlock-tree-card"
        ref={panelRef}
        data-mode={isMaximized ? "centered" : "docked"}
        data-closing={isClosing ? "true" : undefined}
      >
        <div className="wd-unlock-tree-header">
          <span className="wd-unlock-tree-title">✦ {t("unlock.title")}</span>
          <span className="wd-points-chip">
            <span className="wd-points-chip__icon">◆</span>
            {formatPoints(available)}
          </span>
          <button
            type="button"
            className="wd-icon-btn"
            onClick={() =>
              void (isMaximized ? restoreUnlockTree() : maximizeUnlockTree())
            }
            aria-label={
              isMaximized ? t("unlock.restore") : t("unlock.maximize")
            }
            title={isMaximized ? t("unlock.restore") : t("unlock.maximize")}
          >
            {isMaximized ? "⤡" : "⤢"}
          </button>
          <button
            type="button"
            className="wd-icon-btn"
            onClick={() => void closeUnlockTree()}
            aria-label={t("unlock.close")}
          >
            ✕
          </button>
        </div>

        <div
          ref={svgContainerRef}
          className="wd-unlock-tree-field"
          onMouseMove={(e) => {
            const card = panelRef.current;
            if (!card) return;
            const rect = card.getBoundingClientRect();
            setPointer({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        >
          <svg
            viewBox={`0 0 ${treeViewBox.w} ${treeViewBox.h}`}
            style={{ width: "100%", height: "100%" }}
            preserveAspectRatio="xMidYMid meet"
          >
            {treeLayout
              .filter((n) => n.node_id !== "root.awaken")
              .map((n) => {
                const center = treeLayout[0];
                const nodeState = nodes.find((s) => s.nodeId === n.node_id);
                const parentId = findParentInChain(n.node_id);
                const parentLayout = parentId
                  ? findLayout(parentId, treeLayout)
                  : center;
                const parentState = parentId
                  ? nodes.find((s) => s.nodeId === parentId)
                  : rootState;

                const fromX = parentLayout?.x ?? center.x;
                const fromY = parentLayout?.y ?? center.y;

                const parentUnlocked = parentState?.unlocked ?? false;
                const selfUnlocked = nodeState?.unlocked ?? false;
                const solid = parentUnlocked && selfUnlocked;

                const strokeColor =
                  solid || parentUnlocked
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
              <UnlockAwakenBurst
                center={tree.center}
                onDone={() => setBurstActive(false)}
              />
            )}

            {treeLayout.map((layout) => {
              const state = nodes.find((s) => s.nodeId === layout.node_id);
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
                  size={isCenter ? tree.centerSize : tree.nodeSize}
                  isCenter={isCenter}
                  isRootAwakened={isRootAwakened}
                  onHoverEnter={() => {
                    cancelClear();
                    setHoverNodeId(layout.node_id);
                    setPurchaseError(null);
                  }}
                  onHoverLeave={scheduleClear}
                  holdProgress={nodeHoldProgress}
                  holdEnabled={true}
                  onHoldMouseDown={(e) => {
                    if (!canHold(layout.node_id)) return;
                    if (
                      activeHoldNodeId &&
                      activeHoldNodeId !== layout.node_id
                    ) {
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
                x={treeViewBox.w / 2}
                y={treeViewBox.h - 18}
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

        <div className="wd-unlock-tree-hint">{t("unlock.holdHint")}</div>

        {hoveredNode && hoveredLayout && anchor && panelSize.w > 0 && (
          <UnlockTooltip
            key={hoveredNode.nodeId}
            layout={hoveredLayout}
            state={hoveredNode}
            availablePoints={available}
            isRootAwakened={isRootAwakened}
            isCenter={hoveredNode.nodeId === "root.awaken"}
            purchaseError={purchaseError}
            onMouseEnter={cancelClear}
            onMouseLeave={scheduleClear}
            anchor={anchor}
            panelRect={panelSize}
            compact={!isMaximized}
            pointer={pointer}
          />
        )}
      </div>

      {confirmNodeId && confirmLayout && confirmState && (
        <UnlockHoldConfirmModal
          layout={confirmLayout}
          cost={confirmState.cost}
          availablePoints={available}
          isPurchasing={purchasingId === confirmNodeId}
          onConfirm={() => void handlePurchase(confirmNodeId)}
          onCancel={() => {
            if (purchasingId === confirmNodeId) return;
            setConfirmNodeId(null);
            setPurchaseError(null);
          }}
        />
      )}
    </>
  );
}
