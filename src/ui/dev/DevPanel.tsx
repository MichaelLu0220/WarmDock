import { useState } from "react";
import { forceDailyRefresh } from "../../app/orchestrators/dailyRefresh";
import { useSessionStore } from "../../app/stores/sessionStore";
import { useTaskStore } from "../../app/stores/taskStore";
import { useWalletStore } from "../../app/stores/walletStore";
import { gateways } from "../../data";

/** dev only:模擬換日 / 重置資料。release build 後端沒有對應 command。 */
export function DevPanel() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleForceRefresh = async () => {
    try {
      const result = await forceDailyRefresh();
      addLog(
        `換日完成 → wallet: ${result.wallet.walletPoints}pt, streak: ${result.wallet.streakDays}天`
      );
    } catch (err) {
      addLog(`錯誤:${err}`);
    }
  };

  const handleResetAll = async () => {
    try {
      await gateways.dev.resetAllData();
      useTaskStore.getState().setTasks([]);
      useSessionStore.getState().setTodaySummary(null);
      useSessionStore.getState().setAllTasksCompleted(false);
      useWalletStore.getState().setWallet({
        walletPoints: 0,
        pendingTodayPoints: 0,
        streakDays: 0,
        lastCompletedDate: null,
        lastRolloverDate: null,
        bestStreakDays: 0,
        lifetimePointsEarned: 0,
        pointsSpentOnUnlocks: 0,
        pendingTodayUnlockSpent: 0,
      });
      addLog("全部資料已重置");
    } catch (err) {
      addLog(`錯誤:${err}`);
    }
  };

  return (
    <div className="wd-dev">
      <div className="wd-dev__title">🛠 Dev Panel</div>
      <div className="wd-dev__actions">
        <button
          type="button"
          className="wd-dev__btn"
          onClick={() => void handleForceRefresh()}
        >
          模擬換日
        </button>
        <button
          type="button"
          className="wd-dev__btn wd-dev__btn--danger"
          onClick={() => void handleResetAll()}
        >
          重置所有資料
        </button>
      </div>
      {log.length > 0 && (
        <div className="wd-dev__log">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
