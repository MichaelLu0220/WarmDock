import { toAppError } from "@warmdock/core/errors";
import type { Settings, SettingsPatch } from "@warmdock/core/types";
import { getGateways } from "../client";
import { defaultSettings } from "../profile";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Web settings. Theme and locale are synced to the cloud profile; the remaining
 * (window-only) fields are kept in local store state so the existing components
 * keep working but do not persist anything meaningless server-side.
 */
export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  const current = useSettingsStore.getState().settings ?? defaultSettings();
  const merged: Settings = { ...current };
  if (patch.themeMode !== undefined) merged.themeMode = patch.themeMode;
  if (patch.panelWidth !== undefined) merged.panelWidth = patch.panelWidth;
  if (patch.pinEnabled !== undefined) merged.pinEnabled = patch.pinEnabled;
  if (patch.refreshTime !== undefined) merged.refreshTime = patch.refreshTime;
  if (patch.locale !== undefined) merged.locale = patch.locale;

  // optimistic local update
  useSettingsStore.getState().setSettings(merged);

  try {
    if (patch.themeMode !== undefined || patch.locale !== undefined) {
      await getGateways().settings.updatePreferences({
        ...(patch.themeMode !== undefined ? { themeMode: patch.themeMode } : {}),
        ...(patch.locale !== undefined ? { locale: patch.locale } : {}),
      });
    }
    return merged;
  } catch (err) {
    throw toAppError(err);
  }
}
