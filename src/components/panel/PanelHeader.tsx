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
    <div className="px-4 pt-5 pb-3 border-b border-gray-100">
      {/* 日期 */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">{today}</h1>
      </div>

      {/* Greeting */}
      <p className="mt-1 text-sm text-gray-500">今天想完成什麼？</p>

      {/* 積分列 */}
      {wallet && walletDisplay && (
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
          <span>💰</span>
          <span className="font-medium">{walletDisplay.main}</span>
		  {walletDisplay.suffix && (
			<span className="text-blue-500">{walletDisplay.suffix}</span>
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