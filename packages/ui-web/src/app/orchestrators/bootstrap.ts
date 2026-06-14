import { toAppError } from "@warmdock/core/errors";
import type { Snapshot } from "@warmdock/api";
import { getCache } from "../cache";
import { getGateways } from "../client";
import { profileToSettings } from "../profile";
import { useSessionStore } from "../stores/sessionStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTaskStore } from "../stores/taskStore";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";

/** Fill every store from a snapshot (used for both online and cached data). */
function applySnapshot(snap: Snapshot): void {
  useTaskStore.getState().setTasks(snap.tasks);
  useWalletStore.getState().setWallet(snap.wallet);
  useSettingsStore.getState().setSettings(profileToSettings(snap.profile));
  useUnlockStore.getState().setStatus(snap.unlocks);

  const session = useSessionStore.getState();
  session.setToday(snap.today ?? "");
  session.setTodaySummary(snap.summary);

  const committed = snap.tasks.filter((t) => t.status !== "draft");
  session.setAllTasksCompleted(
    committed.length > 0 &&
      committed.length >= snap.unlocks.maxVisibleTaskSlots &&
      committed.every((t) => t.status === "completed")
  );
}

/**
 * Cloud startup: fetch the authoritative snapshot and fill every store. On
 * success the snapshot is written to the (optional) encrypted cache. If the
 * server is unreachable, fall back to the cache in read-only (offline) mode.
 */
export async function runBootstrap(): Promise<void> {
  const session = useSessionStore.getState();
  session.startBootstrap();

  try {
    const snap = await getGateways().session.bootstrap();
    applySnapshot(snap);
    useSessionStore.getState().setOffline(false);
    const cache = getCache();
    if (cache) {
      void cache.saveSnapshot(snap).catch((e) => console.warn("cache save failed", e));
    }
    useSessionStore.getState().finishBootstrap();
  } catch (err) {
    const cache = getCache();
    if (cache) {
      try {
        const cached = await cache.loadSnapshot();
        if (cached) {
          applySnapshot(cached);
          useSessionStore.getState().setOffline(true);
          useSessionStore.getState().finishBootstrap();
          return;
        }
      } catch {
        // cache unavailable — fall through to the error path
      }
    }
    useSessionStore.getState().failBootstrap(toAppError(err).message);
  }
}
