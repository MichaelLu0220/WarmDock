import type { Settings } from "@warmdock/core/types";
import type { Profile } from "@warmdock/api";

/**
 * The cloud Profile holds synced preferences (theme, locale, custom refresh);
 * the desktop-era Settings shape also carries window-only fields. On web those
 * window fields are inert defaults so the existing components render unchanged.
 */
export function defaultSettings(): Settings {
  return {
    themeMode: "system",
    panelWidth: 320,
    pinEnabled: false,
    refreshTime: "00:00",
    triggerPositionY: 0.5,
    locale: "en",
  };
}

export function profileToSettings(profile: Profile): Settings {
  return {
    ...defaultSettings(),
    themeMode: profile.themeMode,
    locale: profile.locale,
    refreshTime: profile.customRefreshTime ?? "00:00",
  };
}
