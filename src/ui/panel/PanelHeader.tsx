import { useEffect, useRef, useState } from "react";
import { updateSettings } from "../../app/orchestrators/settings";
import { openUnlockTree } from "../../app/orchestrators/windowFlow";
import { useSettingsStore } from "../../app/stores/settingsStore";
import { useUIStore } from "../../app/stores/uiStore";
import { useWalletStore } from "../../app/stores/walletStore";
import { t } from "../../core/i18n";
import { formatDisplayDate } from "../../core/rules/date";
import { formatPoints, formatWalletDisplay } from "../../core/rules/points";

const FLASH_DURATION_MS = 600;
const HOLD_BEFORE_SWAP_MS = 620;
const PULSE_DURATION_MS = 220;

export function PanelHeader() {
  const wallet = useWalletStore((s) => s.wallet);
  const headerFlash = useUIStore((s) => s.headerPointsFlash);
  const clearHeaderFlash = useUIStore((s) => s.clearHeaderPointsFlash);
  const openSettings = useUIStore((s) => s.openSettings);
  const settings = useSettingsStore((s) => s.settings);
  const today = formatDisplayDate();

  const realPending = wallet?.pendingTodayPoints ?? 0;
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

    // 用 store 送來的 oldPending(完成前快照),不自己用減法算
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
    ? formatWalletDisplay(wallet.walletPoints, displayedPending)
    : null;

  const todayUnlockSpent = wallet?.pendingTodayUnlockSpent ?? 0;
  const isPinned = settings?.pinEnabled ?? false;

  const handleTogglePin = async () => {
    try {
      await updateSettings({ pinEnabled: !isPinned });
    } catch (err) {
      console.error("toggle pin failed:", err);
    }
  };

  const pinTitle = isPinned ? t("header.unpin") : t("header.pin");

  return (
    <div className="wd-header">
      <div className="wd-header__row">
        <div style={{ flex: 1 }}>
          <h1 className="wd-header__date">{today}</h1>
          <p className="wd-header__greeting">{t("header.greeting")}</p>
        </div>

        <div className="wd-header__actions">
          <button
            type="button"
            className={`wd-icon-btn ${isPinned ? "wd-icon-btn--active" : ""}`}
            onClick={handleTogglePin}
            aria-label={pinTitle}
            title={pinTitle}
          >
            {isPinned ? "●" : "○"}
          </button>

          <button
            type="button"
            className="wd-icon-btn"
            onClick={openSettings}
            aria-label={t("header.settings")}
            title={t("header.settings")}
          >
            {"⚙︎"}
          </button>

          <button
            type="button"
            className="wd-icon-btn"
            onClick={() => void openUnlockTree()}
            aria-label={t("header.unlockTree")}
            title={t("header.unlockTree")}
          >
            ✦
          </button>
        </div>
      </div>

      {wallet && walletDisplay && (
        <div className="wd-header__wallet">
          <span style={{ color: "var(--wd-gold)" }}>◆</span>
          <span style={{ fontWeight: 700 }}>{walletDisplay.main}</span>
          {walletDisplay.suffix && (
            <span
              className={
                pulseOn
                  ? "wd-header-pending wd-header-pending--pulse"
                  : "wd-header-pending"
              }
            >
              {walletDisplay.suffix}
            </span>
          )}
          {todayUnlockSpent > 0 && (
            <span style={{ color: "var(--wd-orange)" }}>
              (-{formatPoints(todayUnlockSpent)})
            </span>
          )}
          {wallet.streakDays > 0 && (
            <span className="wd-header__streak">
              ▲ {t("header.streakDays", { days: wallet.streakDays })}
            </span>
          )}

          {localFlash && (
            <span key={localFlash.id} className="wd-header-flash">
              +{formatPoints(localFlash.amount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
