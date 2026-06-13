import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { closePanel, closeUnlockTree } from "../orchestrators/windowFlow";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { getAutoHideAction } from "./autoHidePolicy";

/** 視窗失焦時依 pin、modal 與能力配置模式決定收起哪一層。 */
export function useAutoHide() {
  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | null = null;

    async function attach() {
      const win = getCurrentWindow();
      const stop = await win.onFocusChanged(({ payload: focused }) => {
        if (!mounted || focused) return;

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
          void closeUnlockTree();
        } else if (action === "panel") {
          void closePanel();
        }
      });

      if (mounted) {
        unlisten = stop;
      } else {
        stop();
      }
    }

    void attach();

    return () => {
      mounted = false;
      unlisten?.();
      unlisten = null;
    };
  }, []);
}
