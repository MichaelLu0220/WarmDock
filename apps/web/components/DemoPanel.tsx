"use client";

import "../lib/i18nSetup";
import { useEffect, useState } from "react";
import Link from "next/link";
import { configureGateways, useBootstrap, useUIStore, Panel } from "@warmdock/ui-web";
import { createDemoGateways } from "../lib/demoGateways";
import { DemoBookFlip } from "./DemoBookFlip";
import { DemoCoachmark } from "./DemoCoachmark";
import { DemoSettlementLink } from "./DemoSettlementLink";
import { DemoStepCards } from "./DemoStepCards";
import { DemoTourProvider } from "./DemoTour";
import { OpenSignInButton } from "./OpenSignInButton";
import { SignInModal } from "./SignInModal";

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
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);
  useEffect(() => {
    setPanelOpen(true);
  }, [setPanelOpen]);
  useEffect(() => {
    const prev = document.body.style.scrollbarGutter;
    document.body.style.scrollbarGutter = "auto";
    return () => { document.body.style.scrollbarGutter = prev; };
  }, []);

  return (
    <DemoTourProvider>
      <div className="wd-demo">
        <header className="wd-nav">
          <Link className="wd-nav-brand" href="/">
            WarmDock
          </Link>
          <nav className="wd-nav-links">
            <Link href="/">Home</Link>
          </nav>
          <div className="wd-nav-cta">
            <OpenSignInButton className="wd-btn ghost">Sign in</OpenSignInButton>
          </div>
        </header>

        <section className="wd-demo-intro">
          <p className="wd-eyebrow">Live demo</p>
          <h1>
            This is your dock.
            <br />
            Go ahead — use it.
          </h1>

          <DemoStepCards />

          <DemoSettlementLink />

          <p className="wd-demo-note">
            Nothing is saved in the demo.{" "}
            <OpenSignInButton className="wd-demo-note-link">
              Sign in to keep your streak
            </OpenSignInButton>
            .
          </p>
        </section>

        <Panel chrome="minimal" />
        <DemoBookFlip />
        <DemoCoachmark />

        {/* Sign in 開啟同頁置中字卡(與首頁一致) */}
        <SignInModal />
      </div>
    </DemoTourProvider>
  );
}
