import type { RefreshResult } from "../../core/types";
import { gateways } from "../../data";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useUIStore } from "../stores/uiStore";
import { useWalletStore } from "../stores/walletStore";
import { loadUnlockProgress } from "./unlocks";

/** refresh 結果套用到所有 store(換日後畫面歸零 + 昨日 ceremony) */
async function applyRefreshResult(result: RefreshResult): Promise<void> {
  if (!result.refreshApplied) return;

  useWalletStore.getState().setWallet(result.wallet);
  useTaskStore.getState().setTasks([]);

  const session = useSessionStore.getState();
  session.setToday(result.newDate);
  session.setTodaySummary(null);
  session.setAllTasksCompleted(false);

  useUIStore.getState().showPreviousDaySummary(result.previousSummary);

  // 今日解鎖花費桶歸零,重拉 progress 讓配置器 affordability 正確
  await loadUnlockProgress();
}

export async function checkDailyRefresh(): Promise<RefreshResult> {
  const result = await gateways.session.runDailyRefreshIfNeeded();
  await applyRefreshResult(result);
  return result;
}

/** dev 模擬換日 */
export async function forceDailyRefresh(): Promise<RefreshResult> {
  const result = await gateways.dev.forceDailyRefresh();
  await applyRefreshResult(result);
  return result;
}
