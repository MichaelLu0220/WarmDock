/**
 * Platform window adapter. The shared flow orchestration (windowFlow) toggles UI
 * flags the same way everywhere, but the actual OS-window operations differ:
 * desktop (Tauri) resizes/moves a real window; web has no window to move.
 *
 * Web leaves the default no-op adapter; desktop calls configurePlatformWindow()
 * with a windowManager-backed implementation.
 */
export type WindowMode = "trigger" | "panel" | "configurator";

export interface PlatformWindow {
  mode(): WindowMode;
  toPanel(): Promise<void>;
  toTrigger(): Promise<void>;
  toFullscreen(): Promise<void>;
  focus(): Promise<void>;
  quit(): Promise<void>;
}

const noop = async () => {};

const noopPlatformWindow: PlatformWindow = {
  mode: () => "panel",
  toPanel: noop,
  toTrigger: noop,
  toFullscreen: noop,
  focus: noop,
  quit: noop,
};

let current: PlatformWindow = noopPlatformWindow;

export function configurePlatformWindow(platform: PlatformWindow): void {
  current = platform;
}

export function getPlatformWindow(): PlatformWindow {
  return current;
}
