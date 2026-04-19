import { useRef, useState } from "react";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { useUIStore } from "../../store/useUIStore";
import {
  getMonitorVerticalBounds,
  syncCenterAnchorFromCurrentWindow,
} from "../../lib/windowMode";
import { useSettingsStore } from "../../store/useSettingsStore";

export function TriggerBubble() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const setTriggerPosition = useSettingsStore((s) => s.setTriggerPosition);

  const holdTimerRef = useRef<number | null>(null);

  const startScreenYRef = useRef(0);
  const startWindowYRef = useRef(0);
  const startWindowXRef = useRef(0);
  const windowHeightRef = useRef(0);

  const monitorTopRef = useRef(0);
  const monitorBottomRef = useRef(0);

  const pendingYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const didDragRef = useRef(false);

  const clearHoldTimer = () => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const runRAF = () => {
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(async () => {
      if (pendingYRef.current == null) {
        rafRef.current = null;
        return;
      }

      const y = pendingYRef.current;

      const win = getCurrentWindow();
      await win.setPosition(
        new PhysicalPosition(startWindowXRef.current, Math.round(y))
      );

      rafRef.current = null;
    });
  };

  const handlePointerDown = async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    const win = getCurrentWindow();
    const pos = await win.outerPosition();
    const size = await win.outerSize();

    const { top, bottom } = await getMonitorVerticalBounds();

    startScreenYRef.current = e.screenY;
    startWindowYRef.current = pos.y;
    startWindowXRef.current = pos.x;
    windowHeightRef.current = size.height;

    monitorTopRef.current = top;
    monitorBottomRef.current = bottom;

    didDragRef.current = false;

    clearHoldTimer();

    holdTimerRef.current = window.setTimeout(() => {
      setIsDragging(true);
      didDragRef.current = true;
    }, 2000);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const deltaY = e.screenY - startScreenYRef.current;
    const rawY = startWindowYRef.current + deltaY;

    const minY = monitorTopRef.current;
    const maxY = monitorBottomRef.current - windowHeightRef.current;

    const clampedY = Math.max(minY, Math.min(rawY, maxY));

    pendingYRef.current = clampedY;
    runRAF();
  };

  const finishDrag = async (e?: React.PointerEvent<HTMLButtonElement>) => {
    clearHoldTimer();

    if (e && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (isDragging) {
      setIsDragging(false);

      // 等最後一幀跑完
      if (rafRef.current != null) {
        await new Promise((r) => setTimeout(r, 16));
      }

      await syncCenterAnchorFromCurrentWindow();
	  const win = getCurrentWindow();
	  const pos = await win.outerPosition();
	  const size = await win.outerSize();
	  const { top, bottom } = await getMonitorVerticalBounds();

	  const centerY = pos.y + size.height / 2;
	  const ratio = (centerY - top) / (bottom - top);
	  const clamped = Math.max(0, Math.min(ratio, 1));

	  await setTriggerPosition({
	    trigger_position_y: clamped,
	  });
    }
  };

  const handleClick = async () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    await togglePanel();
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className="wd-trigger"
      style={{
        cursor: isDragging ? "grabbing" : "pointer",
        userSelect: "none",
      }}
    >
      <span className="wd-trigger__arrow">
        {isPanelOpen ? "›" : "‹"}
      </span>
    </button>
  );
}