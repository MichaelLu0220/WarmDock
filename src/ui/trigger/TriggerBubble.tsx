import { useRef, useState } from "react";
import { saveTriggerPosition } from "../../app/orchestrators/settings";
import { togglePanel } from "../../app/orchestrators/windowFlow";
import { useUIStore } from "../../app/stores/uiStore";
import { windowManager } from "../../app/window/windowManager";

const HOLD_TO_DRAG_MS = 2000;

/**
 * 右緣 trigger:點擊 toggle panel,長按 2 秒進入垂直拖曳。
 * 拖曳的座標細節在 windowManager,這裡只做手勢判斷。
 */
export function TriggerBubble() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isUnlockTreeOpen = useUIStore((s) => s.isUnlockTreeOpen);
  const isWindowTransitioning = useUIStore((s) => s.isWindowTransitioning);

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
    void togglePanel();
  };

  // 能力配置開啟或原生視窗正在 resize 時隱藏 trigger。
  // 等 set_window_rect 完成後才重新掛載,避免在舊座標短暫閃爍。
  if (isUnlockTreeOpen || isWindowTransitioning) return null;

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
