import { useWalletStore } from "../../store/useWalletStore";

export function PanelHeader() {
  const wallet = useWalletStore((s) => s.wallet);

  const today = new Date().toLocaleDateString("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="px-4 pt-5 pb-3 border-b border-gray-100">
      {/* 日期 */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">{today}</h1>
      </div>

      {/* Greeting */}
      <p className="mt-1 text-sm text-gray-500">今天想完成什麼？</p>

      {/* 積分列 */}
      {wallet && (
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
          <span>💰</span>
          <span className="font-medium">{wallet.wallet_points}</span>
          {wallet.pending_today_points > 0 && (
            <span className="text-blue-500">
              (+{wallet.pending_today_points})
            </span>
          )}
          {wallet.streak_days > 0 && (
            <span className="ml-auto text-xs text-orange-400">
              🔥 {wallet.streak_days} 天
            </span>
          )}
        </div>
      )}
    </div>
  );
}