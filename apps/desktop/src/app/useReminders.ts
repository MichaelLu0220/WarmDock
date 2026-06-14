import { useEffect } from "react";
import { useSettingsStore, useTaskStore } from "@warmdock/ui-web";
import { formatTimeUntilRefresh } from "@warmdock/core/rules/date";
import { getIntensity, isEnabled, type ReminderIntensity } from "../lib/notifyPref";
import { notify } from "../lib/notifications";

const CHECK_MS = 5 * 60 * 1000;

// per-intensity reminder window (how close to reset before reminding) + min gap
function policy(intensity: ReminderIntensity): { windowMin: number; gapMin: number } | null {
  switch (intensity) {
    case "off":
      return null;
    case "low":
      return { windowMin: 120, gapMin: 240 };
    case "high":
      return { windowMin: 480, gapMin: 60 };
    default:
      return { windowMin: 240, gapMin: 120 };
  }
}

function minutesUntilReset(refreshTime: string, now = new Date()): number {
  const [hh, mm] = refreshTime.split(":").map((s) => parseInt(s, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return Infinity;
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return Math.floor((target.getTime() - now.getTime()) / 60000);
}

/**
 * Smart desktop reminders: when committed tasks remain unfinished and the daily
 * reset is approaching, send an OS notification — cadence scaled by intensity.
 * (Desktop-only; reads the shared stores.)
 */
export function useReminders() {
  useEffect(() => {
    let lastNotified = 0;

    const tick = async () => {
      if (!isEnabled()) return;
      const pol = policy(getIntensity());
      if (!pol) return;

      const tasks = useTaskStore.getState().tasks;
      const unfinished = tasks.filter((t) => t.status === "ready").length;
      if (unfinished === 0) return;

      const refreshTime = useSettingsStore.getState().settings?.refreshTime ?? "00:00";
      const mins = minutesUntilReset(refreshTime);
      if (mins > pol.windowMin) return;

      if (Date.now() - lastNotified < pol.gapMin * 60000) return;
      lastNotified = Date.now();

      await notify(
        "WarmDock",
        `還有 ${unfinished} 件任務,距今日重置約 ${formatTimeUntilRefresh(refreshTime)}。`
      );
    };

    const id = window.setInterval(() => void tick(), CHECK_MS);
    void tick();
    return () => window.clearInterval(id);
  }, []);
}
