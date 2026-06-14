"use client";

import "../lib/i18nSetup";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@warmdock/core/i18n";
import { getWarmDockClient } from "../lib/supabaseClient";

const dangerStyle = { background: "#b3402f", color: "#fff", borderColor: "#8f2f22" } as const;

export function AccountPanel() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setBusy(true);
    setError(null);
    try {
      const client = getWarmDockClient();
      await client.auth.requestAccountDeletion();
      await client.auth.signOut();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function signOut() {
    await getWarmDockClient().auth.signOut();
    router.replace("/");
  }

  return (
    <div className="wd-web-auth">
      <h1>{t("account.title")}</h1>
      <button className="wd-web-btn" onClick={signOut} style={{ background: "transparent" }}>
        {t("account.signOut")}
      </button>

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #d8cdb0" }} />

      <h2>{t("account.deleteTitle")}</h2>
      <p>{t("account.deleteWarning")}</p>
      {!confirming ? (
        <button className="wd-web-btn" style={dangerStyle} onClick={() => setConfirming(true)}>
          {t("account.deleteButton")}
        </button>
      ) : (
        <div>
          <button className="wd-web-btn" style={dangerStyle} onClick={deleteAccount} disabled={busy}>
            {busy ? t("account.deleting") : t("account.deleteConfirm")}
          </button>
          <button
            className="wd-web-btn"
            onClick={() => setConfirming(false)}
            disabled={busy}
            style={{ marginLeft: 8, background: "transparent" }}
          >
            {t("account.deleteCancel")}
          </button>
        </div>
      )}
      {error && <p className="wd-web-error">{error}</p>}
    </div>
  );
}
