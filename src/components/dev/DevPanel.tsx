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
      addLog(
        `換日完成 → wallet: ${result.wallet.wallet_points}pt, streak: ${result.wallet.streak_days}天`
      );
    } catch (err) {
      addLog(`錯誤：${err}`);
    }
  };

  const handleResetAll = async () => {
    try {
      await invoke("reset_all_data");
      setWallet({ wallet_points: 0, pending_today_points: 0, streak_days: 0, last_completed_date: null, best_streak_days: 0 });
      setTasks([]);
      setSummary(null as any);
      setAllTasksCompleted(false);
      addLog("全部資料已重置");
    } catch (err) {
      addLog(`錯誤：${err}`);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-64 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-lg text-xs">
      <div className="mb-2 font-bold text-orange-600">🛠 Dev Panel</div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleForceRefresh}
          className="rounded-lg bg-orange-400 px-3 py-1.5 text-white hover:bg-orange-500"
        >
          模擬換日（Force Daily Refresh）
        </button>
        <button
          onClick={handleResetAll}
          className="rounded-lg bg-red-400 px-3 py-1.5 text-white hover:bg-red-500"
        >
          重置所有資料
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="mt-3 max-h-24 overflow-y-auto rounded bg-white p-2 text-gray-600 font-mono">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}