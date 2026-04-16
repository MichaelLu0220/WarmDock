import { useSummaryStore } from "../../store/useSummaryStore";
import { useWalletStore } from "../../store/useWalletStore";
import { useUIStore } from "../../store/useUIStore";
import { getVisibleSlotCount } from "../../lib/unlock";
import { formatPointsDelta } from "../../lib/points";
import type { DailySummary } from "../../models/DailySummary";
import type { UserWallet } from "../../models/UserWallet";

type CeremonyMode = "full" | "partial" | "empty" | "previous_day";

function CeremonyContent({
  mode,
  summary,
  wallet,
  onStartNewDay,
  actionLabel = "開始新的一天",
}: {
  mode: CeremonyMode;
  summary: DailySummary | null;
  wallet: UserWallet | null;
  onStartNewDay?: () => void;
  actionLabel?: string;
}) {
  if (mode === "full") {
    return (
      <div className="wd-ceremony">
        <div className="wd-ceremony__icon">✦</div>
        <h2 className="wd-ceremony__title">今天的承諾,都兌現了。</h2>
        <p className="wd-ceremony__subtitle">你做到了。</p>
        {summary && (
          <div className="wd-ceremony__stats">
            <div className="wd-ceremony__stat">
              <div className="wd-ceremony__stat-value">{summary.tasks_completed}</div>
              <div className="wd-ceremony__stat-label">完成任務</div>
            </div>
            <div className="wd-ceremony__stat">
              <div className="wd-ceremony__stat-value wd-ceremony__stat-value--gold">
                {formatPointsDelta(summary.points_earned)}
              </div>
              <div className="wd-ceremony__stat-label">今日積分</div>
            </div>
            {wallet && wallet.streak_days > 0 && (
              <div className="wd-ceremony__stat">
                <div className="wd-ceremony__stat-value wd-ceremony__stat-value--orange">
                  {wallet.streak_days}
                </div>
                <div className="wd-ceremony__stat-label">連續天數</div>
              </div>
            )}
          </div>
        )}
        <p className="wd-modal__hint" style={{ marginTop: 20 }}>
          積分將在明天開始時存入錢包。
        </p>
        {onStartNewDay && (
          <button
            type="button"
            className="wd-btn"
            style={{ marginTop: 14 }}
            onClick={onStartNewDay}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (mode === "partial") {
    return (
      <div className="wd-ceremony">
        <div className="wd-ceremony__icon">◇</div>
        <h2 className="wd-ceremony__title">今天完成了一部分。</h2>
        <p className="wd-ceremony__subtitle">每一步都算數,明天繼續。</p>
        {summary && (
          <div className="wd-ceremony__stats">
            <div className="wd-ceremony__stat">
              <div className="wd-ceremony__stat-value">{summary.tasks_completed}</div>
              <div className="wd-ceremony__stat-label">完成任務</div>
            </div>
            <div className="wd-ceremony__stat">
              <div className="wd-ceremony__stat-value wd-ceremony__stat-value--gold">
                {formatPointsDelta(summary.points_earned)}
              </div>
              <div className="wd-ceremony__stat-label">今日積分</div>
            </div>
          </div>
        )}
        <p className="wd-modal__hint" style={{ marginTop: 20 }}>
          積分將在明天開始時存入錢包。
        </p>
        {onStartNewDay && (
          <button
            type="button"
            className="wd-btn"
            style={{ marginTop: 14 }}
            onClick={onStartNewDay}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (mode === "empty") {
    return (
      <div className="wd-ceremony">
        <div className="wd-ceremony__icon">○</div>
        <h2 className="wd-ceremony__title">昨天沒有留下紀錄。</h2>
        <p className="wd-ceremony__subtitle">今天是新的開始。</p>
      </div>
    );
  }

  // previous_day
  if (!summary) {
    return (
      <div className="wd-ceremony">
        <div className="wd-ceremony__icon">○</div>
        <h2 className="wd-ceremony__title">昨天沒有留下紀錄。</h2>
        <p className="wd-ceremony__subtitle">今天是新的開始。</p>
        {onStartNewDay && (
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            style={{ marginTop: 22 }}
            onClick={onStartNewDay}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  // previous_day 有 summary 的情境:改用 tasks_created 比對
  const isFullComplete =
    summary.tasks_created > 0 && summary.tasks_completed >= summary.tasks_created;
  const hasAny = summary.tasks_completed > 0;

  return (
    <div className="wd-ceremony">
      <div className="wd-ceremony__icon">
        {isFullComplete ? "✦" : hasAny ? "◇" : "○"}
      </div>
      <h2 className="wd-ceremony__title">
        {isFullComplete
          ? "昨天的承諾,全都兌現了。"
          : hasAny
          ? "昨天完成了一部分。"
          : "昨天沒有留下紀錄。"}
      </h2>
      <p className="wd-ceremony__subtitle">
        {isFullComplete
          ? "帶著這份動力,繼續今天。"
          : hasAny
          ? "每一步都算數,今天繼續。"
          : "今天是新的開始,試著訂下一個目標。"}
      </p>
      {hasAny && (
        <div className="wd-ceremony__stats">
          <div className="wd-ceremony__stat">
            <div className="wd-ceremony__stat-value">{summary.tasks_completed}</div>
            <div className="wd-ceremony__stat-label">完成任務</div>
          </div>
          <div className="wd-ceremony__stat">
            <div className="wd-ceremony__stat-value wd-ceremony__stat-value--gold">
              {formatPointsDelta(summary.points_earned)}
            </div>
            <div className="wd-ceremony__stat-label">昨日積分</div>
          </div>
          {wallet && wallet.streak_days > 0 && (
            <div className="wd-ceremony__stat">
              <div className="wd-ceremony__stat-value wd-ceremony__stat-value--orange">
                {wallet.streak_days}
              </div>
              <div className="wd-ceremony__stat-label">連續天數</div>
            </div>
          )}
        </div>
      )}
      {onStartNewDay && (
        <button
          type="button"
          className="wd-btn wd-btn-primary"
          style={{ marginTop: 22 }}
          onClick={onStartNewDay}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function CompletionCeremony() {
  const summary = useSummaryStore((s) => s.todaySummary);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocks = useUIStore((s) => s.unlocks);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);

  const unlockMaxSlots = getVisibleSlotCount(unlocks);
  const tasksCompleted = summary?.tasks_completed ?? 0;
  const isFullComplete = tasksCompleted >= unlockMaxSlots;
  const mode: CeremonyMode = isFullComplete ? "full" : "partial";

  return (
    <CeremonyContent
      mode={mode}
      summary={summary}
      wallet={wallet}
      onStartNewDay={() => setAllTasksCompleted(false)}
      actionLabel="查看今日任務"
    />
  );
}

export function PreviousDayCeremony() {
  const previousDaySummary = useUIStore((s) => s.previousDaySummary);
  const wallet = useWalletStore((s) => s.wallet);
  const closePreviousDaySummary = useUIStore((s) => s.closePreviousDaySummary);

  return (
    <CeremonyContent
      mode="previous_day"
      summary={previousDaySummary}
      wallet={wallet}
      onStartNewDay={closePreviousDaySummary}
    />
  );
}