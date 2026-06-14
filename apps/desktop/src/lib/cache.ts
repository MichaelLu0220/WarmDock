import { invoke } from "@tauri-apps/api/core";
import type { Snapshot } from "@warmdock/api";
import type { CacheAdapter } from "@warmdock/ui-web";

/**
 * Desktop offline cache: snapshots are encrypted (AES-GCM) and stored per-account
 * by the Rust side, with the key in the OS credential vault. The raw key never
 * reaches the frontend.
 */
export function createDesktopCache(userId: string): CacheAdapter {
  return {
    async saveSnapshot(snapshot: Snapshot) {
      await invoke("cache_write_snapshot", { userId, snapshot: JSON.stringify(snapshot) });
    },
    async loadSnapshot() {
      const data = await invoke<string | null>("cache_read_snapshot", { userId });
      return data ? (JSON.parse(data) as Snapshot) : null;
    },
  };
}
