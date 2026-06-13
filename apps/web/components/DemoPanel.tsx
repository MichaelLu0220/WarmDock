"use client";

import { useEffect, useState } from "react";
import { configureGateways, useBootstrap } from "@warmdock/ui-web";
import { createDemoGateways } from "../lib/demoGateways";
import { PanelStage } from "./PanelStage";

let configured = false;

/** Unauthenticated demo: in-memory fake data, never persisted. */
export function DemoPanel() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!configured) {
      configureGateways(createDemoGateways());
      configured = true;
    }
    setReady(true);
  }, []);

  return ready ? <DemoBody /> : null;
}

function DemoBody() {
  useBootstrap(null); // gateways already configured; no realtime in demo
  return <PanelStage />;
}
