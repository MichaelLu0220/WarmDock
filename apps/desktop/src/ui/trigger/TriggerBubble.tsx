import { useRef, useState } from "react";
import { saveTriggerPosition } from "../../app/orchestrators/settings";
import {
  collapsePanelFromUnlock,
  togglePanel,
} from "../../app/orchestrators/windowFlow";
import { useUIStore } from "../../app/stores/uiStore";
import { windowManager } from "../../app/window/windowManager";

const HOLD_TO_DRAG_MS = 2000;

/**
 * 右緣 trigger:點擊 toggle panel,長按 2 秒進入垂直拖曳。
 * 拖曳的座標細節在 windowManager,這裡只做手勢判斷。
 */
export function TriggerBubble() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isUnlockExpanded = useUIStore((s) => s.isUnlockExpanded);

  const holdTimerRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const clearHoldTimer = () => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    didDragRef.current = false;
    clearHoldTimer();

    const startScreenY = e.screenY;
    holdTimerRef.current = window.setTimeout(() => {
      void windowManager.beginDrag(startScreenY).then(() => {
        setIsDragging(true);
        didDragRef.current = true;
      });
    }, HOLD_TO_DRAG_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    windowManager.dragTo(e.screenY);
  };

  const finishDrag = async (e?: React.PointerEvent<HTMLButtonElement>) => {
    clearHoldTimer();
    if (e && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!isDragging) return;

    setIsDragging(false);
    const ratio = await windowManager.endDrag();
    if (ratio != null) {
      saveTriggerPosition(ratio).catch((err) =>
        console.error("save trigger position failed:", err)
      );
    }
  };

  const handleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    // 第二頁面(docked)開啟時點 trigger → 直接收合成泡泡(含關掉能力配置);
    // 否則就是一般的展開/收合面板。
    if (useUIStore.getState().isUnlockTreeOpen) {
      void collapsePanelFromUnlock();
    } else {
      void togglePanel();
    }
  };

  // 只有視窗鋪滿(第三頁面/放大態)時才隱藏 trigger —— 那時 right:0/top:50%
  // 會把它定位到螢幕中央。docked 第二頁面與面板展開/收合期間都保持顯示,
  // 讓使用者隨時能用它收合(且收合的視窗縮放不會讓它閃掉)。
  if (isUnlockExpanded) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => void finishDrag(e)}
      onPointerCancel={(e) => void finishDrag(e)}
      className={`wd-trigger ${isDragging ? "wd-trigger--dragging" : ""}`}
    >
      <span className="wd-trigger__arrow">{isPanelOpen ? "›" : "‹"}</span>
    </button>
  );
}
