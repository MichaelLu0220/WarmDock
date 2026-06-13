import { useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { windowManager } from "../window/windowManager";

const THEME_CACHE_KEY = "wd-theme";

function setResolvedTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  // 快取最後生效的主題,下次啟動在 settings 載入前就能套用,避免閃色
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // localStorage 不可用時略過快取
  }
}

/** main.tsx 在 React render 前呼叫,用上次的主題避免啟動閃白 */
export function applyCachedTheme() {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (cached === "dark" || cached === "light") {
      document.documentElement.dataset.theme = cached;
    }
  } catch {
    // ignore
  }
}

/**
 * 把 settings 即時套用到外觀:
 * - themeMode → <html data-theme>(system 模式跟隨 OS 並監聽變化)
 * - panelWidth → CSS 變數 + windowManager(panel 開著時立即 resize)
 */
export function useApplySettings() {
  const themeMode = useSettingsStore((s) => s.settings?.themeMode ?? "light");
  const panelWidth = useSettingsStore((s) => s.settings?.panelWidth ?? 320);

  useEffect(() => {
    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => setResolvedTheme(mq.matches ? "dark" : "light");
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    setResolvedTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--wd-panel-w",
      `${panelWidth}px`
    );
    windowManager.setPanelCssWidth(panelWidth);

    if (useUIStore.getState().isPanelOpen) {
      windowManager
        .toPanel()
        .catch((e) => console.error("apply panel width failed", e));
    }
  }, [panelWidth]);
}
