// gateway injection
export { configureGateways, getGateways, type UiGateways } from "./app/client";
export { profileToSettings, defaultSettings } from "./app/profile";

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
