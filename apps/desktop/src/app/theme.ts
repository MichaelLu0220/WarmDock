import { useEffect } from "react";
import { useSettingsStore, useUIStore } from "@warmdock/ui-web";
import { windowManager } from "./window/windowManager";

const THEME_CACHE_KEY = "wd-theme";

function setResolvedTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // ignore
  }
}

/** Called before React render to apply the last theme and avoid a flash. */
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

/** Apply theme + panel width from the shared settings store to the desktop window. */
export function useApplyTheme() {
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
    document.documentElement.style.setProperty("--wd-panel-w", `${panelWidth}px`);
    windowManager.setPanelCssWidth(panelWidth);
    if (useUIStore.getState().isPanelOpen) {
      windowManager.toPanel().catch((e) => console.error("apply panel width failed", e));
    }
  }, [panelWidth]);
}
