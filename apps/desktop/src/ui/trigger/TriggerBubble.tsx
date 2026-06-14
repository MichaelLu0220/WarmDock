import { useRef, useState } from "react";
import { collapsePanelFromUnlock, togglePanel, useUIStore } from "@warmdock/ui-web";
import { windowManager } from "../../app/window/windowManager";
import { saveTriggerPositionY } from "../../lib/triggerPosition";

const HOLD_TO_DRAG_MS = 2000;

/** Right-edge trigger: click toggles the panel, 2s hold enters vertical drag. */
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
    if (ratio != null) saveTriggerPositionY(ratio);
  };

  const handleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (useUIStore.getState().isUnlockTreeOpen) {
      void collapsePanelFromUnlock();
    } else {
      void togglePanel();
    }
  };

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
