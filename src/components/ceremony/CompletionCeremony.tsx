import { useSummaryStore } from "../../store/useSummaryStore";
import { useWalletStore } from "../../store/useWalletStore";
import { useUIStore } from "../../store/useUIStore";
import { getVisibleSlotCount } from "../../lib/unlock";
import { formatPointsDelta } from "../../lib/points";
import type { DailySummary } from "../../models/DailySummary";
import type { UserWallet } from "../../models/UserWallet";

type CeremonyMode = "full" | "partial" | "empty" | "previous_day";

type Props = {
  mode?: CeremonyMode;
  summary?: DailySummary | null;
  onStartNewDay?: () => void;
};

function CeremonyContent({ mode, summary, wallet, onStartNewDay }: {
  mode: CeremonyMode;
  summary: DailySummary | null;
  wallet: UserWallet | null;
  onStartNewDay?: () => void;
}) {
  if (mode === "full") {
    return (
      <>
        <div className="mb-4 text-4xl">✦</div>
        <h2 className="text-base font-semibold text-gray-800">今天的承諾，都兌現了。</h2>
        <p className="mt-1 text-sm text-gray-500">你做到了。</p>
        {summary && (
          <div className="mt-6 flex gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">{summary.tasks_completed}</div>
              <div className="text-xs text-gray-400">完成任務</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-500">
				{formatPointsDelta(summary.points_earned)}
			  </div>
              <div className="text-xs text-gray-400">今日積分</div>
            </div>
            {wallet && wallet.streak_days > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-500">{wallet.streak_days}</div>
                <div className="text-xs text-gray-400">連續天數</div>
              </div>
            )}
          </div>
        )}
        <p className="mt-8 text-xs text-gray-400">積分將在明天開始時存入錢包。</p>
      </>
    );
  }

  if (mode === "partial") {
    return (
      <>
        <div className="mb-4 text-4xl">◇</div>
        <h2 className="text-base font-semibold text-gray-800">今天完成了一部分。</h2>
        <p className="mt-1 text-sm text-gray-500">每一步都算數，明天繼續。</p>
        {summary && (
          <div className="mt-6 flex gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">{summary.tasks_completed}</div>
              <div className="text-xs text-gray-400">完成任務</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-500">
				{formatPointsDelta(summary.points_earned)}
			  </div>
              <div className="text-xs text-gray-400">今日積分</div>
            </div>
          </div>
        )}
        <p className="mt-8 text-xs text-gray-400">積分將在明天開始時存入錢包。</p>
      </>
    );
  }

  if (mode === "empty") {
    return (
      <>
        <div className="mb-4 text-4xl">○</div>
        <h2 className="text-base font-semibold text-gray-800">昨天沒有留下紀錄。</h2>
        <p className="mt-1 text-sm text-gray-500">今天是新的開始，試著訂下一個目標。</p>
      </>
    );
  }

  // previous_day
  if (!summary) {
    return (
      <>
        <div className="mb-4 text-4xl">○</div>
        <h2 className="text-base font-semibold text-gray-800">昨天沒有留下紀錄。</h2>
        <p className="mt-1 text-sm text-gray-500">今天是新的開始。</p>
        {onStartNewDay && (
          <button
            onClick={onStartNewDay}
            className="mt-8 rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            開始新的一天
          </button>
        )}
      </>
    );
  }

  const isFullComplete = summary.tasks_completed >= 3;
  const hasAny = summary.tasks_completed > 0;

  return (
    <>
      <div className="mb-4 text-4xl">
        {isFullComplete ? "✦" : hasAny ? "◇" : "○"}
      </div>
      <h2 className="text-base font-semibold text-gray-800">
        {isFullComplete
          ? "昨天的承諾，全都兌現了。"
          : hasAny
          ? "昨天完成了一部分。"
          : "昨天沒有留下紀錄。"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {isFullComplete
          ? "帶著這份動力，繼續今天。"
          : hasAny
          ? "每一步都算數，今天繼續。"
          : "今天是新的開始，試著訂下一個目標。"}
      </p>
      {hasAny && (
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">{summary.tasks_completed}</div>
            <div className="text-xs text-gray-400">完成任務</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-500">
				{formatPointsDelta(summary.points_earned)}
			</div>
            <div className="text-xs text-gray-400">昨日積分</div>
          </div>
          {wallet && wallet.streak_days > 0 && (
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-500">{wallet.streak_days}</div>
              <div className="text-xs text-gray-400">連續天數</div>
            </div>
          )}
        </div>
      )}
      {onStartNewDay && (
        <button
          onClick={onStartNewDay}
          className="mt-8 rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          開始新的一天
        </button>
      )}
    </>
  );
}

export function CompletionCeremony() {
  const summary = useSummaryStore((s) => s.todaySummary);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocks = useUIStore((s) => s.unlocks);
  const unlockMaxSlots = getVisibleSlotCount(unlocks);

  const isFullComplete = (summary?.tasks_completed ?? 0) >= unlockMaxSlots;
  const mode: CeremonyMode = isFullComplete ? "full" : "partial";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <CeremonyContent mode={mode} summary={summary} wallet={wallet} />
    </div>
  );
}

export function PreviousDayCeremony() {
  const previousSummary = useUIStore((s) => s.previousDaySummary);
  const wallet = useWalletStore((s) => s.wallet);
  const closePreviousDaySummary = useUIStore((s) => s.closePreviousDaySummary);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <CeremonyContent
        mode="previous_day"
        summary={previousSummary}
        wallet={wallet}
        onStartNewDay={closePreviousDaySummary}
      />
    </div>
  );
}