import { toAppError } from "../../core/errors";
import { gateways } from "../../data";
import { useSessionStore } from "../stores/sessionStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTaskStore } from "../stores/taskStore";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";
import { windowManager } from "../window/windowManager";

/** 啟動流程:抓快照、填滿所有 store、還原視窗錨點。 */
export async function runBootstrap(): Promise<void> {
  const session = useSessionStore.getState();
  session.startBootstrap();

  try {
    // 記錄啟動時的視窗位置當錨點,之後所有 resize 以此為準
    await windowManager.init();

    const snap = await gateways.session.bootstrap();

    useTaskStore.getState().setTasks(snap.tasks);
    useWalletStore.getState().setWallet(snap.wallet);
    useSettingsStore.getState().setSettings(snap.settings);
    useUnlockStore.getState().setStatus(snap.unlocks);

    const sessionNow = useSessionStore.getState();
    sessionNow.setToday(snap.today);
    sessionNow.setTodaySummary(snap.summary);

    await windowManager.setAnchorFromRatio(snap.settings.triggerPositionY);

    // 開機時就已全完成 → 直接進 ceremony 狀態
    const committed = snap.tasks.filter((t) => t.status !== "draft");
    if (
      committed.length >= snap.unlocks.maxVisibleTaskSlots &&
      committed.every((t) => t.status === "completed")
    ) {
      sessionNow.setAllTasksCompleted(true);
    }

    useSessionStore.getState().finishBootstrap();
  } catch (err) {
    useSessionStore.getState().failBootstrap(toAppError(err).message);
  }
}
