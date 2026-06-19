// @warmdock/app — framework-agnostic application layer (stores, orchestrators,
// gateway/cache/auth/platform injection). Shared by web, desktop, and mobile.
// Contains no DOM or platform UI; React is only used by the useBootstrap hook.

// injection points
export { configureGateways, getGateways, type UiGateways } from "./client";
export { configureCache, getCache, type CacheAdapter } from "./cache";
export { configureAuthActions, getAuthActions, type AuthActions } from "./authActions";
export { profileToSettings, defaultSettings } from "./profile";

// stores
export { useTaskStore } from "./stores/taskStore";
export { useWalletStore } from "./stores/walletStore";
export { useUnlockStore } from "./stores/unlockStore";
export { useSessionStore } from "./stores/sessionStore";
export { useSettingsStore } from "./stores/settingsStore";
export { useUIStore } from "./stores/uiStore";

// orchestrators
export {
  loadTodayTasks,
  createTask,
  updateTaskTitle,
  discardTask,
  setTaskDetail,
  completeTask,
} from "./orchestrators/tasks";
export { analyzeTaskProposal } from "./orchestrators/ai";
export { loadUnlockProgress, purchaseUnlock } from "./orchestrators/unlocks";
export { updateSettings } from "./orchestrators/settings";
export { runBootstrap, checkConnection } from "./orchestrators/bootstrap";

// lifecycle hook
export { useBootstrap } from "./hooks/useBootstrap";
