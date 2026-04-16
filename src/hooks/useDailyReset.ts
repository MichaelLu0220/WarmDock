import { useEffect } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { useWalletStore } from "../store/useWalletStore";
import { useSummaryStore } from "../store/useSummaryStore";
import { useUIStore } from "../store/useUIStore";
import { runDailyRefreshIfNeeded } from "../commands/invoke";

export function useDailyReset() {
  const setTasks = useTaskStore((s) => s.setTasks);
  const setWallet = useWalletStore((s) => s.setWallet);
  const setSummary = useSummaryStore((s) => s.setSummary);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);

  const showPreviousDaySummary = useUIStore((s) => s.showPreviousDaySummary);
  const setUnlocks = useUIStore((s) => s.setUnlocks);
  
  useEffect(() => {
    async function checkReset() {
      try {
        const result = await runDailyRefreshIfNeeded();
		if (result.refresh_applied) {
		  setWallet(result.wallet);
		  setTasks([]);
		  setSummary(null as any);
		  setAllTasksCompleted(false);
		  //setUnlockMaxSlots(3); // MVP 固定，之後從 result 讀
		  showPreviousDaySummary(result.previous_summary);
		}
      } catch (err) {
        console.error("daily reset check failed:", err);
      }
    }

    checkReset();
  }, []);
}