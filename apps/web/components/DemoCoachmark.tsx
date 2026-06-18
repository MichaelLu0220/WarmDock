"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@warmdock/ui-web";
import { useDemoTour } from "./DemoTour";

/**
 * 面板上的引導泡泡:讀共用的導覽進度(DemoTourProvider),指向當前步驟的目標元素。
 * 進度推進邏輯在 provider,本元件只負責定位與顯示。
 */
export function DemoCoachmark() {
  const { index, step, flashing, awaitingOverlay } = useDemoTour();
  const detailOpen = useUIStore((s) => s.isTaskDetailOpen);
  const settingsOpen = useUIStore((s) => s.isSettingsOpen);
  const expanded = useUIStore((s) => s.isUnlockExpanded);
  const completionFlash = useUIStore((s) => s.taskCompletionFlash);
  const prevSummaryOpen = useUIStore((s) => s.isPreviousDaySummaryOpen);

  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const hidden =
    awaitingOverlay ||
    (step.id !== "weight" && detailOpen) ||
    settingsOpen ||
    expanded ||
    (!step.raise && !!completionFlash) ||
    prevSummaryOpen;

  // 切換步驟時清位置 —— 等新目標真正出現再顯示,避免瞬移
  useEffect(() => {
    setPos(null);
  }, [step]);

  // 量測目標位置(找不到目標就不顯示,持續重試到它出現)
  useEffect(() => {
    if (hidden || flashing) return;
    let raf = 0;
    let tries = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width >= 6) {
          setPos({
            top: Math.round(r.top + r.height / 2),
            right: Math.round(window.innerWidth - r.left + 14),
          });
          return true;
        }
      }
      return false;
    };
    const tick = () => {
      if (measure()) return;
      if (tries++ > 300) return;
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [hidden, flashing, step, completionFlash]);

  if (!pos || hidden) return null;

  return (
    <div
      className={`wd-coach ${flashing ? "wd-coach--done" : ""}`}
      style={{ top: pos.top, right: pos.right, ...(step.raise && { zIndex: 60 }) }}
    >
      <span className="wd-coach-label">
        {flashing ? "✓ Nice" : `${index + 1}. ${step.hint}`}
      </span>
    </div>
  );
}
