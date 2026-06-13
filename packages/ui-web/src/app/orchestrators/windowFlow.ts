/**
 * Web "flow" orchestration: the same UI-state transitions as the desktop
 * windowFlow, but with no native window resizing — only the uiStore animation
 * flags. Keeps the exact export surface the shared components import.
 */
import { DUR_PANEL } from "../../ui/motion";
import { useUIStore } from "../stores/uiStore";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function openUnlockTree(): void {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  ui.setUnlockTreeOpen(true);
}

export async function closeUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  if (ui.isUnlockTreeClosing) return;

  ui.setUnlockTreeClosing(true);
  await delay(DUR_PANEL);

  const u = useUIStore.getState();
  u.setUnlockTreeOpen(false);
  u.setUnlockTreeClosing(false);
  u.setUnlockMaximized(false);
  u.setUnlockExpanded(false);
}

export function collapsePanelFromUnlock(): void {
  const ui = useUIStore.getState();
  ui.setUnlockTreeOpen(false);
  ui.setUnlockTreeClosing(false);
  ui.setUnlockMaximized(false);
  ui.setUnlockExpanded(false);
}

export async function maximizeUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockExpanded(true);
  ui.setUnlockMaximized(true);
}

export async function restoreUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  ui.setUnlockExpanded(false);
}

/** No-op on web (desktop quits the app). */
export async function quitApp(): Promise<void> {
  /* web has no app window to quit */
}
