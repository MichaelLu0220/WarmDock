import { toAppError } from "@warmdock/core/errors";
import { getGateways } from "../client";
import { profileToSettings } from "../profile";
import { useSessionStore } from "../stores/sessionStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTaskStore } from "../stores/taskStore";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";

/** Cloud startup: fetch the authoritative snapshot and fill every store. */
export async function runBootstrap(): Promise<void> {
  const session = useSessionStore.getState();
  session.startBootstrap();

  try {
    const snap = await getGateways().session.bootstrap();

    useTaskStore.getState().setTasks(snap.tasks);
    useWalletStore.getState().setWallet(snap.wallet);
    useSettingsStore.getState().setSettings(profileToSettings(snap.profile));
    useUnlockStore.getState().setStatus(snap.unlocks);

    const sessionNow = useSessionStore.getState();
    sessionNow.setToday(snap.today ?? "");
    sessionNow.setTodaySummary(snap.summary);

    const committed = snap.tasks.filter((t) => t.status !== "draft");
    sessionNow.setAllTasksCompleted(
      committed.length > 0 &&
        committed.length >= snap.unlocks.maxVisibleTaskSlots &&
        committed.every((t) => t.status === "completed")
    );

    useSessionStore.getState().finishBootstrap();
  } catch (err) {
    useSessionStore.getState().failBootstrap(toAppError(err).message);
  }
}
