"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { configureGateways, useBootstrap } from "@warmdock/ui-web";
import { getWarmDockClient } from "../lib/supabaseClient";
import { PanelStage } from "./PanelStage";

/** Authenticated panel: real Supabase client + realtime; redirects if signed out. */
export function AppPanel() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const client = getWarmDockClient();
    configureGateways(client);
    let active = true;

    void client.auth.getSession().then((session) => {
      if (!active) return;
      if (!session) {
        setUserId(null);
        router.replace("/sign-in");
      } else {
        setUserId(session.user.id);
      }
    });

    const unsubscribe = client.auth.onAuthStateChange((session) => {
      if (!active) return;
      if (!session) {
        setUserId(null);
        router.replace("/sign-in");
      } else {
        setUserId(session.user.id);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (userId === undefined) return <p className="wd-web-status">Loading…</p>;
  if (userId === null) return <p className="wd-web-status">Redirecting to sign in…</p>;
  return <AuthedBody userId={userId} />;
}

function AuthedBody({ userId }: { userId: string }) {
  useBootstrap(userId);
  return <PanelStage />;
}
