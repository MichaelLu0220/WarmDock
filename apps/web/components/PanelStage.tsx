"use client";

import { useEffect } from "react";
import { Panel, useUIStore } from "@warmdock/ui-web";

/** Hosts the shared WarmDock panel on a web page (always open — no window chrome). */
export function PanelStage() {
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);
  useEffect(() => {
    setPanelOpen(true);
  }, [setPanelOpen]);

  return (
    <div className="wd-web-stage">
      <Panel />
    </div>
  );
}
