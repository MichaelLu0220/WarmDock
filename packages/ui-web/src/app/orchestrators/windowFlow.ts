/**
 * Flow orchestration shared by web and desktop. UI flag transitions are
 * identical everywhere; OS-window operations are delegated to the injected
 * PlatformWindow (no-op on web, windowManager-backed on desktop).
 */
import { DUR_PANEL } from "../../ui/motion";
import { getPlatformWindow } from "../platform";
import { useUIStore } from "../stores/uiStore";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () =>
  new Promise<void>((r) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => r());
    else setTimeout(r, 0);
  });

export async function openPanel(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setWindowTransitioning(true);
  try {
    await getPlatformWindow().toPanel();
    useUIStore.getState().setPanelOpen(true);
    void getPlatformWindow().focus();
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
}

export async function closePanel(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setWindowTransitioning(true);
  ui.setPanelOpen(false);
  try {
    await delay(DUR_PANEL + 40);
    if (!useUIStore.getState().isPanelOpen) {
      await getPlatformWindow().toTrigger();
    }
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
}

export async function togglePanel(): Promise<void> {
  if (useUIStore.getState().isPanelOpen) await closePanel();
  else await openPanel();
}

export function openUnlockTree(): void {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  ui.setUnlockTreeOpen(true);
  void getPlatformWindow().focus();
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

  if (getPlatformWindow().mode() === "configurator") {
    u.setWindowTransitioning(true);
    try {
      await getPlatformWindow().toPanel();
    } finally {
      const u2 = useUIStore.getState();
      u2.setUnlockExpanded(false);
      u2.setWindowTransitioning(false);
    }
  } else {
    u.setUnlockExpanded(false);
  }
}

export async function collapsePanelFromUnlock(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockTreeOpen(false);
  ui.setUnlockTreeClosing(false);
  ui.setUnlockMaximized(false);
  ui.setUnlockExpanded(false);
  await closePanel();
}

export async function maximizeUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockExpanded(true);
  ui.setWindowTransitioning(true);
  try {
    await getPlatformWindow().toFullscreen();
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
  await nextFrame();
  if (useUIStore.getState().isUnlockTreeOpen) {
    useUIStore.getState().setUnlockMaximized(true);
  }
}

export async function restoreUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  await delay(DUR_PANEL + 40);
  if (useUIStore.getState().isUnlockMaximized) return;
  ui.setWindowTransitioning(true);
  try {
    await getPlatformWindow().toPanel();
  } finally {
    const u = useUIStore.getState();
    u.setUnlockExpanded(false);
    u.setWindowTransitioning(false);
  }
}

export async function quitApp(): Promise<void> {
  await getPlatformWindow().quit();
}
