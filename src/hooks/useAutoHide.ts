import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "../store/useUIStore";
import { useSettingsStore } from "../store/useSettingsStore";

export function useAutoHide() {
  const unlistenRef = useRef<(() => void) | null>(null);
  const currentWindowRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function attach() {
      const win = getCurrentWindow();
      currentWindowRef.current = win;

      const unlisten = await win.onFocusChanged(async ({ payload: focused }) => {
        if (!mounted) return;
        if (focused) {
          // 視窗獲得焦點 → 恢復正常點擊
          await win.setIgnoreCursorEvents(false);
          return;
        }

        // 視窗失焦 → 檢查是否要隱藏並穿透
        const ui = useUIStore.getState();
        const settings = useSettingsStore.getState().settings;

        if (!ui.isPanelOpen) return;
        if (settings?.pin_enabled) return;
        if (ui.isTaskDetailOpen) return;
        if (ui.isUnlockTreeOpen) return;
        if (ui.isComposingTask) return;

        // 決定隱藏並讓滑鼠穿透
        ui.closePanel();

        // 重要：讓滑鼠事件穿透到桌面
        try {
          await win.setIgnoreCursorEvents(true);
        } catch (e) {
          console.error("setIgnoreCursorEvents failed:", e);
        }
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
      // 清理時恢復正常點擊
      currentWindowRef.current?.setIgnoreCursorEvents(false).catch(() => {});
    };
  }, []);
}