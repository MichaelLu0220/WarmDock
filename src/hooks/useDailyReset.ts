import { useEffect } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { useWalletStore } from "../store/useWalletStore";
import { useSummaryStore } from "../store/useSummaryStore";
import { useUIStore } from "../store/useUIStore";
import { useUnlockStore } from "../store/useUnlockStore";
import { runDailyRefreshIfNeeded } from "../commands/invoke";

export function useDailyReset() {
  const setTasks = useTaskStore((s) => s.setTasks);
  const setWallet = useWalletStore((s) => s.setWallet);
  const setSummary = useSummaryStore((s) => s.setSummary);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);
  const showPreviousDaySummary = useUIStore((s) => s.showPreviousDaySummary);
  const loadUnlockProgress = useUnlockStore((s) => s.loadProgress);

  useEffect(() => {
    async function checkReset() {
      try {
        const result = await runDailyRefreshIfNeeded();
        if (result.refresh_applied) {
          setWallet(result.wallet);
          setTasks([]);
          setSummary(null as any);
          setAllTasksCompleted(false);
          showPreviousDaySummary(result.previous_summary);
          // 今日花費桶跨日歸零,要重拉 progress 讓配置器看到正確的 affordability
          await loadUnlockProgress();
        }
      } catch (err) {
        console.error("daily reset check failed:", err);
      }
    }

    checkReset();
  }, []);
}