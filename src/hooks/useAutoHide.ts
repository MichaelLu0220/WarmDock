import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "../store/useUIStore";
import { useSettingsStore } from "../store/useSettingsStore";

export function useAutoHide() {
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    async function attach() {
      const win = getCurrentWindow();

      const unlisten = await win.onFocusChanged(({ payload: focused }) => {
        if (!mounted) return;
        if (focused) return; // 只處理失焦

        // 每次觸發讀 latest state
        const ui = useUIStore.getState();
        const settings = useSettingsStore.getState().settings;

        if (!ui.isPanelOpen) return;
        if (settings?.pin_enabled) return;
        if (ui.isTaskDetailOpen) return;
        if (ui.isUnlockTreeOpen) return;
        if (ui.isComposingTask) return;

        // closePanel 內部會自動縮 window 成 trigger size,
        // 視窗縮小後桌面其他區域自然可以被點到,
        // 不需要 setIgnoreCursorEvents。
        ui.closePanel();
      });

      if (mounted) {
        unlistenRef.current = unlisten;
      } else {
        unlisten();
      }
    }

    attach();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);
}