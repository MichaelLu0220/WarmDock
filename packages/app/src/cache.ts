/**
 * Offline cache adapter. Desktop injects an encrypted, per-account local cache
 * (Tauri keyring + AES-GCM); web leaves it null (no offline cache in the first
 * release). The shared bootstrap saves the snapshot when online and falls back to
 * the cache (read-only) when the authoritative server is unreachable.
 */
import type { Snapshot } from "@warmdock/api";

export interface CacheAdapter {
  saveSnapshot(snapshot: Snapshot): Promise<void>;
  loadSnapshot(): Promise<Snapshot | null>;
}

let current: CacheAdapter | null = null;

export function configureCache(adapter: CacheAdapter | null): void {
  current = adapter;
}

export function getCache(): CacheAdapter | null {
  return current;
}
