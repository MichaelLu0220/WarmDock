import { useState } from "react";
import { useUIStore } from "@warmdock/ui-web";
import { ensureNotificationPermission, notify } from "../lib/notifications";
import { isDecided, setEnabled } from "../lib/notifyPref";

const card: React.CSSProperties = {
  position: "fixed",
  left: 12,
  right: 60,
  bottom: 12,
  zIndex: 50,
  padding: "12px 14px",
  borderRadius: 10,
  background: "var(--wd-paper, #f4ecd8)",
  border: "1px solid var(--wd-line, #c9bfa6)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
  fontSize: 13,
};

/**
 * One-time reminder opt-in. Explains the purpose first; the OS permission prompt
 * appears only after the user actively chooses to enable. Shown over the open panel.
 */
export function ReminderOptIn() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const [dismissed, setDismissed] = useState(() => isDecided());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed || !isPanelOpen) return null;

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const granted = await ensureNotificationPermission();
      setEnabled(granted);
      if (granted) {
        // immediate confirmation so the user can see notifications work
        await notify("WarmDock", "提醒已開啟,我會在快到每日重置時提醒你未完成的任務。");
        setDismissed(true);
      } else {
        setError("系統未允許通知,請到系統設定開啟 WarmDock 的通知權限。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function later() {
    setEnabled(false);
    setDismissed(true);
  }

  return (
    <div style={card}>
      <p style={{ margin: "0 0 10px" }}>
        WarmDock 可以在快到每日重置時,提醒你還沒完成的任務。要開啟桌面通知嗎?
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="wd-btn" onClick={enable} disabled={busy}>
          開啟提醒
        </button>
        <button
          className="wd-btn"
          onClick={later}
          disabled={busy}
          style={{ background: "transparent" }}
        >
          稍後
        </button>
      </div>
      {error && <p style={{ color: "#b3402f", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
