"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { configureGateways, useBootstrap } from "@warmdock/ui-web";
import { getWarmDockClient } from "../lib/supabaseClient";
import { PanelStage } from "./PanelStage";
import { RecoveryGate } from "./RecoveryGate";

type Phase = "loading" | "pending" | "active";

/** Authenticated panel: redirects if signed out, shows recovery during grace. */
export function AppPanel() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  const check = useCallback(async () => {
    const client = getWarmDockClient();
    configureGateways(client);
    const session = await client.auth.getSession();
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    setUserId(session.user.id);
    const { data } = await client.supabase
      .from("profiles")
      .select("status")
      .eq("user_id", session.user.id)
      .single();
    setPhase(data?.status === "pending_deletion" ? "pending" : "active");
  }, [router]);

  useEffect(() => {
    void check();
    const unsubscribe = getWarmDockClient().auth.onAuthStateChange((session) => {
      if (!session) router.replace("/sign-in");
    });
    return unsubscribe;
  }, [check, router]);

  if (phase === "loading") return <p className="wd-web-status">Loading…</p>;
  if (phase === "pending") {
    return (
      <RecoveryGate
        onRecovered={() => {
          setPhase("loading");
          void check();
        }}
      />
    );
  }
  return <AuthedBody userId={userId!} />;
}

function AuthedBody({ userId }: { userId: string }) {
  useBootstrap(userId);
  return (
    <>
      <nav className="wd-web-topbar">
        <a href="/account">Account</a>
      </nav>
      <PanelStage />
    </>
  );
}
