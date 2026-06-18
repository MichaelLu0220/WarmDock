import { useSessionStore } from "@warmdock/app";
import { useUIStore } from "@warmdock/app";
import { useUnlockStore } from "@warmdock/app";
import { useWalletStore } from "@warmdock/app";
import { t } from "@warmdock/core/i18n";
import { formatPointsDelta } from "@warmdock/core/rules/points";
import { getVisibleSlotCount } from "@warmdock/core/rules/unlock";
import type { DailySummary, Wallet } from "@warmdock/core/types";

type CeremonyMode = "full" | "partial" | "previous_day";

function Stats({
  summary,
  wallet,
  pointsLabel,
}: {
  summary: DailySummary;
  wallet: Wallet | null;
  pointsLabel: string;
}) {
  return (
    <div className="wd-ceremony__stats">
      <div className="wd-ceremony__stat">
        <div className="wd-ceremony__stat-value">{summary.tasksCompleted}</div>
        <div className="wd-ceremony__stat-label">{t("ceremony.statCompleted")}</div>
      </div>
      <div className="wd-ceremony__stat">
        <div className="wd-ceremony__stat-value wd-ceremony__stat-value--gold">
          {formatPointsDelta(summary.pointsEarned)}
        </div>
        <div className="wd-ceremony__stat-label">{pointsLabel}</div>
      </div>
      {wallet && wallet.streakDays > 0 && (
        <div className="wd-ceremony__stat">
          <div className="wd-ceremony__stat-value wd-ceremony__stat-value--orange">
            {wallet.streakDays}
          </div>
          <div className="wd-ceremony__stat-label">{t("ceremony.statStreak")}</div>
        </div>
      )}
    </div>
  );
}

function CeremonyContent({
  mode,
  summary,
  wallet,
  onAction,
  actionLabel,
}: {
  mode: CeremonyMode;
  summary: DailySummary | null;
  wallet: Wallet | null;
  onAction?: () => void;
  actionLabel?: string;
}) {
  if (mode === "full" || mode === "partial") {
    const isFull = mode === "full";
    return (
      <div className="wd-ceremony">
        <div
          className={`wd-ceremony__icon ${isFull ? "wd-ceremony__icon--rays" : ""}`}
        >
          {isFull ? "✦" : "◇"}
        </div>
        <h2 className="wd-ceremony__title">
          {isFull ? t("ceremony.allDoneTitle") : t("ceremony.partialTitle")}
        </h2>
        <p className="wd-ceremony__subtitle">
          {isFull
            ? t("ceremony.allDoneSubtitle")
            : t("ceremony.partialSubtitle")}
        </p>
        {summary && (
          <Stats
            summary={summary}
            wallet={wallet}
            pointsLabel={t("ceremony.statPointsToday")}
          />
        )}
        <p className="wd-modal__hint" style={{ marginTop: 20 }}>
          {t("ceremony.pointsDeferredHint")}
        </p>
        {onAction && (
          <button
            type="button"
            className="wd-btn"
            style={{ marginTop: 14 }}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  // previous_day
  if (!summary) {
    return (
      <div className="wd-ceremony">
        <div className="wd-ceremony__icon">○</div>
        <h2 className="wd-ceremony__title">{t("ceremony.prevEmptyTitle")}</h2>
        <p className="wd-ceremony__subtitle">
          {t("ceremony.prevEmptySubtitle")}
        </p>
        {onAction && (
          <button
            type="button"
            className="wd-btn wd-btn-primary"
            style={{ marginTop: 22 }}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  // 昨日寬容語意:用 tasksCreated 比對,不回頭審判 max_slots
  const isFullComplete =
    summary.tasksCreated > 0 && summary.tasksCompleted >= summary.tasksCreated;
  const hasAny = summary.tasksCompleted > 0;

  return (
    <div className="wd-ceremony">
      <div
        className={`wd-ceremony__icon ${isFullComplete ? "wd-ceremony__icon--rays" : ""}`}
      >
        {isFullComplete ? "✦" : hasAny ? "◇" : "○"}
      </div>
      <h2 className="wd-ceremony__title">
        {isFullComplete
          ? t("ceremony.prevFullTitle")
          : hasAny
            ? t("ceremony.prevPartialTitle")
            : t("ceremony.prevEmptyTitle")}
      </h2>
      <p className="wd-ceremony__subtitle">
        {isFullComplete
          ? t("ceremony.prevFullSubtitle")
          : hasAny
            ? t("ceremony.prevPartialSubtitle")
            : t("ceremony.prevEmptyGoalSubtitle")}
      </p>
      {hasAny && (
        <Stats
          summary={summary}
          wallet={wallet}
          pointsLabel={t("ceremony.statPointsPrev")}
        />
      )}
      {onAction && (
        <button
          type="button"
          className="wd-btn wd-btn-primary"
          style={{ marginTop: 22 }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** 今日嚴格語意:完成數 == 已解鎖上限才算 full */
export function CompletionCeremony() {
  const summary = useSessionStore((s) => s.todaySummary);
  const setAllTasksCompleted = useSessionStore((s) => s.setAllTasksCompleted);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocks = useUnlockStore((s) => s.status);

  const maxSlots = getVisibleSlotCount(unlocks);
  const isFull = (summary?.tasksCompleted ?? 0) >= maxSlots;

  return (
    <CeremonyContent
      mode={isFull ? "full" : "partial"}
      summary={summary}
      wallet={wallet}
      onAction={() => setAllTasksCompleted(false)}
      actionLabel={t("ceremony.viewTasks")}
    />
  );
}

export function PreviousDayCeremony() {
  const previousDaySummary = useUIStore((s) => s.previousDaySummary);
  const closePreviousDaySummary = useUIStore((s) => s.closePreviousDaySummary);
  const wallet = useWalletStore((s) => s.wallet);

  return (
    <CeremonyContent
      mode="previous_day"
      summary={previousDaySummary}
      wallet={wallet}
      onAction={closePreviousDaySummary}
      actionLabel={t("ceremony.startToday")}
    />
  );
}
