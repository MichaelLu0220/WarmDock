import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTaskStore } from "../../store/useTaskStore";
import { useWalletStore } from "../../store/useWalletStore";
import { useSummaryStore } from "../../store/useSummaryStore";
import { useUIStore } from "../../store/useUIStore";
import type { RunDailyRefreshIfNeededResponse } from "../../commands/types";

export function DevPanel() {
  const [log, setLog] = useState<string[]>([]);

  const setTasks = useTaskStore((s) => s.setTasks);
  const setWallet = useWalletStore((s) => s.setWallet);
  const setSummary = useSummaryStore((s) => s.setSummary);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);
  const showPreviousDaySummary = useUIStore((s) => s.showPreviousDaySummary);

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleForceRefresh = async () => {
    try {
      const result = await invoke<RunDailyRefreshIfNeededResponse>(
        "dev_force_daily_refresh"
      );
      setWallet(result.wallet);
      setTasks([]);
      setSummary(null as any);
      setAllTasksCompleted(false);
      showPreviousDaySummary(result.previous_summary);
      addLog(
        `換日完成 → wallet: ${result.wallet.wallet_points}pt, streak: ${result.wallet.streak_days}天`
      );
    } catch (err) {
      addLog(`錯誤:${err}`);
    }
  };

  const handleResetAll = async () => {
    try {
      await invoke("reset_all_data");
      setWallet({
        wallet_points: 0,
        pending_today_points: 0,
        streak_days: 0,
        last_completed_date: null,
        best_streak_days: 0,
      });
      setTasks([]);
      setSummary(null as any);
      setAllTasksCompleted(false);
      addLog("全部資料已重置");
    } catch (err) {
      addLog(`錯誤:${err}`);
    }
  };

  return (
    <div className="wd-dev">
      <div className="wd-dev__title">🛠 Dev Panel</div>
      <div className="wd-dev__actions">
        <button type="button" className="wd-dev__btn" onClick={handleForceRefresh}>
          模擬換日
        </button>
        <button
          type="button"
          className="wd-dev__btn wd-dev__btn--danger"
          onClick={handleResetAll}
        >
          重置所有資料
        </button>
      </div>
      {log.length > 0 && (
        <div className="wd-dev__log">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}