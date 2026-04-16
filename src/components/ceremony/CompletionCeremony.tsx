import { useSummaryStore } from "../../store/useSummaryStore";
import { useWalletStore } from "../../store/useWalletStore";

export function CompletionCeremony() {
  const summary = useSummaryStore((s) => s.todaySummary);
  const wallet = useWalletStore((s) => s.wallet);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {/* Icon */}
      <div className="mb-4 text-4xl">✦</div>

      {/* Message */}
      <h2 className="text-base font-semibold text-gray-800">
        今天的承諾，都兌現了。
      </h2>
      <p className="mt-1 text-sm text-gray-500">你做到了。</p>

      {/* Stats */}
      {summary && (
        <div className="mt-6 flex gap-6 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-800">
              {summary.tasks_completed}
            </div>
            <div className="text-xs text-gray-400">完成任務</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-amber-500">
              +{summary.points_earned}
            </div>
            <div className="text-xs text-gray-400">今日積分</div>
          </div>
          {wallet && wallet.streak_days > 0 && (
            <div>
              <div className="text-lg font-semibold text-orange-500">
                {wallet.streak_days}
              </div>
              <div className="text-xs text-gray-400">連續天數</div>
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400">
        積分將在明天開始時存入錢包。
      </p>
    </div>
  );
}