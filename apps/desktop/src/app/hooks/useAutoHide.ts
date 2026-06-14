import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { closePanel, collapsePanelFromUnlock, useSettingsStore, useUIStore } from "@warmdock/ui-web";
import { getAutoHideAction } from "./autoHidePolicy";

const BLUR_CONFIRM_DELAY_MS = 100;
const IN_WINDOW_GRACE_MS = 300;

/**
 * Auto-hide the floating window on blur, respecting pin / modals / unlock mode.
 * (Desktop-only; reads the shared ui-web stores.)
 */
export function useAutoHide() {
  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | null = null;
    let blurTimer: number | null = null;
    let lastInWindowPointerTs = 0;

    const onPointerDown = () => {
      lastInWindowPointerTs = Date.now();
    };
    document.addEventListener("pointerdown", onPointerDown, true);

    const clearBlurTimer = () => {
      if (blurTimer != null) {
        window.clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    async function attach() {
      const win = getCurrentWindow();
      const stop = await win.onFocusChanged(({ payload: focused }) => {
        if (!mounted) return;
        if (focused) {
          clearBlurTimer();
          return;
        }
        clearBlurTimer();
        blurTimer = window.setTimeout(async () => {
          blurTimer = null;
          if (!mounted) return;
          if (await win.isFocused()) return;
          if (Date.now() - lastInWindowPointerTs < IN_WINDOW_GRACE_MS) {
            void win.setFocus();
            return;
          }

          const ui = useUIStore.getState();
          const settings = useSettingsStore.getState().settings;
          const action = getAutoHideAction({
            isPanelOpen: ui.isPanelOpen,
            isWindowTransitioning: ui.isWindowTransitioning,
            isTaskDetailOpen: ui.isTaskDetailOpen,
            isUnlockTreeOpen: ui.isUnlockTreeOpen,
            isUnlockMaximized: ui.isUnlockMaximized,
            isSettingsOpen: ui.isSettingsOpen,
            isComposingTask: ui.isComposingTask,
            pinEnabled: settings?.pinEnabled ?? false,
          });

          if (action === "unlock") {
            void collapsePanelFromUnlock();
          } else if (action === "panel") {
            void closePanel();
          }
        }, BLUR_CONFIRM_DELAY_MS);
      });

      if (mounted) unlisten = stop;
      else stop();
    }

    void attach();

    return () => {
      mounted = false;
      clearBlurTimer();
      document.removeEventListener("pointerdown", onPointerDown, true);
      unlisten?.();
      unlisten = null;
    };
  }, []);
}
