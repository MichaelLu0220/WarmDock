// gateway injection
export { configureGateways, getGateways, type UiGateways } from "./app/client";
export { profileToSettings, defaultSettings } from "./app/profile";

// offline cache adapter (desktop injects an encrypted local cache)
export { configureCache, getCache, type CacheAdapter } from "./app/cache";

// optional auth actions surfaced in shared UI (desktop injects sign-out)
export { configureAuthActions, getAuthActions, type AuthActions } from "./app/authActions";

// platform window adapter (desktop injects a windowManager-backed impl)
export {
  configurePlatformWindow,
  getPlatformWindow,
  type PlatformWindow,
  type WindowMode,
} from "./app/platform";

// flow orchestration (shared; window ops go through the platform adapter)
export {
  openPanel,
  closePanel,
  togglePanel,
  openUnlockTree,
  closeUnlockTree,
  collapsePanelFromUnlock,
  maximizeUnlockTree,
  restoreUnlockTree,
  quitApp,
} from "./app/orchestrators/windowFlow";

// lifecycle
export { useBootstrap } from "./app/hooks/useBootstrap";
export { runBootstrap } from "./app/orchestrators/bootstrap";

// orchestrator actions (for custom UI / demo wiring)
export { createTask, setTaskDetail, completeTask, loadTodayTasks } from "./app/orchestrators/tasks";
export { loadUnlockProgress, purchaseUnlock } from "./app/orchestrators/unlocks";
export { updateSettings } from "./app/orchestrators/settings";

// stores
export { useTaskStore } from "./app/stores/taskStore";
export { useWalletStore } from "./app/stores/walletStore";
export { useUnlockStore } from "./app/stores/unlockStore";
export { useSessionStore } from "./app/stores/sessionStore";
export { useSettingsStore } from "./app/stores/settingsStore";
export { useUIStore } from "./app/stores/uiStore";

// the panel + composing pieces
export { Panel } from "./ui/panel/Panel";
export { ErrorBoundary } from "./ui/ErrorBoundary";
export { injectMotionVars } from "./ui/motion";

// i18n passthrough (desktop keeps zh-TW default; web calls setLocale("en"))
export { setLocale, getLocale } from "@warmdock/core/i18n";
