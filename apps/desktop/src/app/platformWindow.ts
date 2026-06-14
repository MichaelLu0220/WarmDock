import type { PlatformWindow, WindowMode } from "@warmdock/ui-web";
import { windowManager } from "./window/windowManager";

/** Desktop implementation of ui-web's PlatformWindow, backed by windowManager. */
export const desktopPlatformWindow: PlatformWindow = {
  mode: () => windowManager.mode as WindowMode,
  toPanel: () => windowManager.toPanel(),
  toTrigger: () => windowManager.toTrigger(),
  toFullscreen: () => windowManager.toFullscreen(),
  focus: () => windowManager.focus(),
  quit: () => windowManager.quitApp(),
};
