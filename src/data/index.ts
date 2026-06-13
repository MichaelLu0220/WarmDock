/**
 * Gateway 組裝點 — 整個 app 透過這裡拿資料存取實作。
 * 未來桌面版接 Supabase 時,只需在這裡換 adapter(或做線上/快取的組合),
 * app 與 ui 層完全不用動。
 */

import type { Gateways } from "./ports";
import {
  tauriDevGateway,
  tauriSessionGateway,
  tauriSettingsGateway,
  tauriTaskGateway,
  tauriUnlockGateway,
} from "./tauri/gateways";

export const gateways: Gateways = {
  task: tauriTaskGateway,
  session: tauriSessionGateway,
  unlock: tauriUnlockGateway,
  settings: tauriSettingsGateway,
  dev: tauriDevGateway,
};

export type { Gateways } from "./ports";
