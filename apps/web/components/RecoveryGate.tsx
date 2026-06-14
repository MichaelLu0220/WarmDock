"use client";

import "../lib/i18nSetup";
import { useState } from "react";
import { t } from "@warmdock/core/i18n";
import { getWarmDockClient } from "../lib/supabaseClient";

/** Shown when a signed-in account is inside its 30-day deletion grace period. */
export function RecoveryGate({ onRecovered }: { onRecovered: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recover() {
    setBusy(true);
    setError(null);
    try {
      await getWarmDockClient().auth.recoverAccount();
      onRecovered();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function signOut() {
    await getWarmDockClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="wd-web-auth">
      <h1>{t("account.recoverTitle")}</h1>
      <p>{t("account.recoverBody")}</p>
      <button className="wd-web-btn" onClick={recover} disabled={busy}>
        {busy ? t("account.recovering") : t("account.recoverButton")}
      </button>
      <button className="wd-web-btn" onClick={signOut} disabled={busy} style={{ marginLeft: 8, background: "transparent" }}>
        {t("account.signOut")}
      </button>
      {error && <p className="wd-web-error">{error}</p>}
    </div>
  );
}
