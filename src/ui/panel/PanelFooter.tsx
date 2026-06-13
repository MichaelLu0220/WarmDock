import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "../../app/stores/sessionStore";
import { useSettingsStore } from "../../app/stores/settingsStore";
import { useTaskStore } from "../../app/stores/taskStore";
import { useUIStore } from "../../app/stores/uiStore";
import { pickRandomMantra, t } from "../../core/i18n";
import { formatTimeUntilRefresh } from "../../core/rules/date";

export function PanelFooter() {
  const settings = useSettingsStore((s) => s.settings);
  const tasks = useTaskStore((s) => s.tasks);
  const summary = useSessionStore((s) => s.todaySummary);
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);

  // 打開 panel 時抽新的 mantra;關閉時保持不變
  // (render 期間的 guarded setState,React 文件認可的 adjust-state 模式)
  const [mantra, setMantra] = useState<string>(() => pickRandomMantra());
  const [prevOpen, setPrevOpen] = useState(isPanelOpen);
  if (isPanelOpen !== prevOpen) {
    setPrevOpen(isPanelOpen);
    if (isPanelOpen) {
      setMantra(pickRandomMantra());
    }
  }

  // 每 30 秒重算剩餘時間
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const refreshTime = settings?.refreshTime ?? "00:00";
  const timeLeft = useMemo(
    () => formatTimeUntilRefresh(refreshTime, now),
    [refreshTime, now]
  );

  const { completed, total } = useMemo(() => {
    if (summary) {
      return { completed: summary.tasksCompleted, total: summary.tasksCreated };
    }
    return {
      completed: tasks.filter((task) => task.status === "completed").length,
      total: tasks.length,
    };
  }, [summary, tasks]);

  return (
    <div className="wd-footer">
      <span>⏰ {t("footer.timeLeft", { time: timeLeft })}</span>
      <span className="wd-footer__sep">·</span>
      <span>
        <span style={{ color: "var(--wd-green)" }}>✓</span> {completed}/{total}
      </span>
      <span className="wd-footer__sep">·</span>
      <span className="wd-footer__mantra">{mantra}</span>
    </div>
  );
}
