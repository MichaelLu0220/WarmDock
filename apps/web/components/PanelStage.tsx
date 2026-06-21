"use client";

import "../lib/i18nSetup";
import { useEffect } from "react";
import { Book, injectMotionVars, useUIStore } from "@warmdock/ui-web";

/** Hosts the WarmDock "book" app on a web page (always open — no window chrome). */
export function PanelStage() {
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);
  useEffect(() => {
    // web 啟動注入動畫時長/緩動 CSS 變數(桌面在 main.tsx 注入;web 先前漏了,
    // 導致 --wd-dur-* 為空、依賴它的開卡/過場動畫不跑)。
    injectMotionVars();
    setPanelOpen(true);
  }, [setPanelOpen]);

  return (
    <div className="wd-web-stage">
      <Book />
    </div>
  );
}
