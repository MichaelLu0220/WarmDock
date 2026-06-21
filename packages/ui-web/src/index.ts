// @warmdock/ui-web — web/desktop DOM components + the platform window adapter +
// panel flow choreography. The framework-agnostic app layer lives in
// @warmdock/app and is re-exported here for convenience (web/desktop import from
// one place; mobile imports @warmdock/app directly).

// re-export the shared app layer (stores, orchestrators, gateway/cache/auth/profile)
export * from "@warmdock/app";

// platform window adapter (desktop injects a windowManager-backed impl)
export {
  configurePlatformWindow,
  getPlatformWindow,
  type PlatformWindow,
  type WindowMode,
} from "./app/platform";

// flow choreography (window ops go through the platform adapter)
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

// DOM pieces
export { Panel } from "./ui/panel/Panel";
export { Book } from "./ui/panel/Book";
export { ErrorBoundary } from "./ui/ErrorBoundary";
export { injectMotionVars } from "./ui/motion";

// i18n passthrough (desktop keeps zh-TW default; web calls setLocale("en"))
export { setLocale, getLocale } from "@warmdock/core/i18n";
