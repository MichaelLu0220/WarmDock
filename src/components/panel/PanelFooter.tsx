import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useSummaryStore } from "../../store/useSummaryStore";
import { useUIStore } from "../../store/useUIStore";
import { pickRandomMantra } from "../../lib/mantras";
import { formatTimeUntilRefresh } from "../../lib/refreshTime";

export function PanelFooter() {
  const settings = useSettingsStore((s) => s.settings);
  const tasks = useTaskStore((s) => s.tasks);
  const summary = useSummaryStore((s) => s.todaySummary);
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);

  // 打開 panel 時抽新的 mantra;關閉時保持不變
  const [mantra, setMantra] = useState<string>(() => pickRandomMantra());
  useEffect(() => {
    if (isPanelOpen) {
      setMantra(pickRandomMantra());
    }
  }, [isPanelOpen]);

  // 每分鐘重算剩餘時間(分鐘數可能會跳)
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const refreshTime = settings?.refresh_time ?? "00:00";
  const timeLeft = useMemo(
    () => formatTimeUntilRefresh(refreshTime, now),
    [refreshTime, now]
  );

  // 完成率:用 summary 當主要來源,沒有就從 tasks 現場算
  const { completed, total } = useMemo(() => {
    if (summary) {
      return {
        completed: summary.tasks_completed,
        total: summary.tasks_created,
      };
    }
    const created = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    return { completed: done, total: created };
  }, [summary, tasks]);

  return (
    <div
      className="wd-footer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
        fontSize: 11,
        lineHeight: 1.4,
      }}
    >
      <span>⏰ 剩 {timeLeft}</span>
      <span style={{ color: "var(--wd-border-soft)" }}>·</span>
      <span>
        <span style={{ color: "var(--wd-green)" }}>✓</span> {completed}/{total}
      </span>
      <span style={{ color: "var(--wd-border-soft)" }}>·</span>
      <span style={{ fontStyle: "italic", color: "var(--wd-ink-soft)" }}>
        {mantra}
      </span>
    </div>
  );
}