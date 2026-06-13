import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  closePanel,
  collapsePanelFromUnlock,
} from "../orchestrators/windowFlow";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { getAutoHideAction } from "./autoHidePolicy";

// 失焦後延遲再判定,讓「失焦」與「視窗內 pointerdown」的時間戳都先就位。
const BLUR_CONFIRM_DELAY_MS = 100;
// 失焦前這段時間內有視窗內 pointerdown → 視為「正在操作視窗」造成的失焦,不收。
const IN_WINDOW_GRACE_MS = 300;

/**
 * 視窗失焦時依 pin、modal 與能力配置模式決定收起哪一層。
 *
 * 本視窗是 transparent + alwaysOnTop 浮層,點視窗內元素有時會讓視窗短暫/持續
 * 失焦,單看失焦會把正在操作首頁的使用者誤收掉。改用 DOM pointerdown 判別:
 * 點視窗內的「實心元素」一定會觸發 pointerdown(穿透的透明區與桌面則不會),
 * 因此失焦若緊接在視窗內 pointerdown 之後 → 是視窗內互動,不收(並補回焦點以便
 * 偵測下次點視窗外);否則才是真的點到視窗外 → 收。
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

        // 重新取得焦點 → 取消待定收合。
        if (focused) {
          clearBlurTimer();
          return;
        }

        clearBlurTimer();
        blurTimer = window.setTimeout(async () => {
          blurTimer = null;
          if (!mounted) return;

          // 焦點已回到視窗 → 不收。
          if (await win.isFocused()) return;

          // 失焦緊接在視窗內 pointerdown 之後 → 是視窗內互動造成的失焦,
          // 不收,並補回焦點(維持武裝,之後點視窗外才偵測得到)。
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
            // 第二頁面開著時點視窗外 → 連同首頁一起收成泡泡。
            void collapsePanelFromUnlock();
          } else if (action === "panel") {
            void closePanel();
          }
        }, BLUR_CONFIRM_DELAY_MS);
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
      clearBlurTimer();
      document.removeEventListener("pointerdown", onPointerDown, true);
      unlisten?.();
      unlisten = null;
    };
  }, []);
}
