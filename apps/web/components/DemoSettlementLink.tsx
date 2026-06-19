"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@warmdock/ui-web";
import { useDemoTour } from "./DemoTour";

/**
 * demo 觸發過結算後出現的捷徑:回到任務頁時,可一鍵重看結算畫面
 * (跳到 summary 步,順帶重播翻書 morph),不必把任務再全部完成一遍。
 * 結算畫面本身顯示時(allTasksCompleted)隱藏 —— 那時已經在結算頁了。
 */
export function DemoSettlementLink() {
  const allDone = useSessionStore((s) => s.allTasksCompleted);
  const { steps, jumpTo } = useDemoTour();
  const [everSettled, setEverSettled] = useState(false);

  useEffect(() => {
    if (allDone) setEverSettled(true);
  }, [allDone]);

  if (!everSettled || allDone) return null;

  const summaryIdx = steps.findIndex((s) => s.id === "summary");
  return (
    <button
      type="button"
      className="wd-btn wd-demo-summary-btn"
      onClick={() => jumpTo(summaryIdx)}
    >
      ✦ Replay today’s summary
    </button>
  );
}
