import { useWalletStore } from "../../store/useWalletStore";
import { formatDisplayDate } from "../../lib/date";
import { formatWalletDisplay } from "../../lib/points";

export function PanelHeader() {
  const wallet = useWalletStore((s) => s.wallet);
  const today = formatDisplayDate();

  const walletDisplay = wallet
    ? formatWalletDisplay(wallet.wallet_points, wallet.pending_today_points)
    : null;

  return (
    <div
      className="wd-header"
      style={{
        paddingBottom: 10,
        marginBottom: 10,
        borderBottom: "2px solid var(--wd-border-soft)",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--wd-ink)" }}>
        {today}
      </h1>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--wd-ink-soft)" }}>
        今天想完成什麼?
      </p>

      {wallet && walletDisplay && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--wd-ink)",
          }}
        >
          <span style={{ color: "var(--wd-gold)" }}>◆</span>
          <span style={{ fontWeight: 700 }}>{walletDisplay.main}</span>
          {walletDisplay.suffix && (
            <span style={{ color: "var(--wd-blue)" }}>{walletDisplay.suffix}</span>
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
        </div>
      )}
    </div>
  );
}