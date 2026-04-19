import { useEffect, useRef, useState } from "react";
import { useWalletStore } from "../../store/useWalletStore";
import { useUIStore } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { formatDisplayDate } from "../../lib/date";
import { formatWalletDisplay, formatPoints } from "../../lib/points";

const FLASH_DURATION_MS = 600;
const HOLD_BEFORE_SWAP_MS = 620;
const PULSE_DURATION_MS = 220;

export function PanelHeader() {
  const wallet = useWalletStore((s) => s.wallet);
  const headerFlash = useUIStore((s) => s.headerPointsFlash);
  const clearHeaderFlash = useUIStore((s) => s.clearHeaderPointsFlash);
  const openUnlockTree = useUIStore((s) => s.openUnlockTree);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const today = formatDisplayDate();

  const realPending = wallet?.pending_today_points ?? 0;
  const [frozenPending, setFrozenPending] = useState<number | null>(null);
  const [pulseOn, setPulseOn] = useState(false);
  const [localFlash, setLocalFlash] = useState<{
    amount: number;
    id: number;
  } | null>(null);

  const prevFlashIdRef = useRef<number | null>(null);
  const timerIdsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((id) => window.clearTimeout(id));
      timerIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!headerFlash) return;
    if (headerFlash.id === prevFlashIdRef.current) return;
    prevFlashIdRef.current = headerFlash.id;

    // 直接用 store 送來的 oldPending,不自己用減法算
    setFrozenPending(headerFlash.oldPending);
    setLocalFlash({ amount: headerFlash.amount, id: headerFlash.id });

    timerIdsRef.current.forEach((id) => window.clearTimeout(id));
    timerIdsRef.current = [];

    const tFlashEnd = window.setTimeout(() => {
      setLocalFlash(null);
      clearHeaderFlash();
    }, FLASH_DURATION_MS);

    const tSwap = window.setTimeout(() => {
      setFrozenPending(null);
      setPulseOn(true);
    }, HOLD_BEFORE_SWAP_MS);

    const tPulseEnd = window.setTimeout(() => {
      setPulseOn(false);
    }, HOLD_BEFORE_SWAP_MS + PULSE_DURATION_MS);

    timerIdsRef.current.push(tFlashEnd, tSwap, tPulseEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerFlash?.id]);

  const displayedPending = frozenPending ?? realPending;

  const walletDisplay = wallet
    ? formatWalletDisplay(wallet.wallet_points, displayedPending)
    : null;

  const todayUnlockSpent = wallet?.pending_today_unlock_spent ?? 0;
  const showSpent = todayUnlockSpent > 0;

  const isPinned = settings?.pin_enabled ?? false;

  const handleTogglePin = async () => {
    try {
      await updateSettings({ pin_enabled: !isPinned });
    } catch (err) {
      console.error("toggle pin failed:", err);
    }
  };

  const pinLabel = isPinned ? "●" : "○";
  const pinTitle = isPinned ? "取消固定" : "固定 panel(不自動關閉)";

  return (
    <div
      className="wd-header"
      style={{
        paddingBottom: 10,
        marginBottom: 10,
        borderBottom: "2px solid var(--wd-border-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--wd-ink)",
            }}
          >
            {today}
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "var(--wd-ink-soft)",
            }}
          >
            今天想完成什麼?
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={handleTogglePin}
            aria-label={pinTitle}
            title={pinTitle}
            style={{
              fontFamily: "var(--wd-font-accent)",
              fontSize: 14,
              color: isPinned ? "var(--wd-gold)" : "var(--wd-border)",
              background: isPinned ? "var(--wd-gold-soft)" : "var(--wd-cream)",
              border: `2px solid ${isPinned ? "var(--wd-gold)" : "var(--wd-border)"}`,
              boxShadow: "var(--wd-shadow-sm)",
              padding: "4px 8px",
              cursor: "pointer",
              borderRadius: 0,
              lineHeight: 1,
            }}
          >
            {pinLabel}
          </button>

          <button
            type="button"
            onClick={openUnlockTree}
            aria-label="開啟能力配置"
            title="能力配置"
            style={{
              fontFamily: "var(--wd-font-accent)",
              fontSize: 14,
              color: "var(--wd-border)",
              background: "var(--wd-cream)",
              border: "2px solid var(--wd-border)",
              boxShadow: "var(--wd-shadow-sm)",
              padding: "4px 8px",
              cursor: "pointer",
              borderRadius: 0,
              lineHeight: 1,
            }}
          >
            ✦
          </button>
        </div>
      </div>

      {wallet && walletDisplay && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--wd-ink)",
            position: "relative",
          }}
        >
          <span style={{ color: "var(--wd-gold)" }}>◆</span>
          <span style={{ fontWeight: 700 }}>{walletDisplay.main}</span>
          {walletDisplay.suffix && (
            <span
              className={
                pulseOn
                  ? "wd-header-pending wd-header-pending--pulse"
                  : "wd-header-pending"
              }
              style={{
                color: "var(--wd-blue)",
                display: "inline-block",
                transformOrigin: "center",
              }}
            >
              {walletDisplay.suffix}
            </span>
          )}
          {showSpent && (
            <span style={{ color: "var(--wd-orange)" }}>
              (-{formatPoints(todayUnlockSpent)})
            </span>
          )}
          {wallet.streak_days > 0 && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--wd-orange)",
              }}
            >
              ▲ {wallet.streak_days} 天
            </span>
          )}

          {localFlash && (
            <span
              key={localFlash.id}
              className="wd-header-flash"
              style={{
                position: "absolute",
                left: 72,
                top: -4,
                color: "var(--wd-gold)",
                fontWeight: 700,
                fontSize: 14,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              +{formatPoints(localFlash.amount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}