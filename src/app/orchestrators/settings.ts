import { toAppError } from "../../core/errors";
import type { Settings, SettingsPatch } from "../../core/types";
import { gateways } from "../../data";
import { useSettingsStore } from "../stores/settingsStore";

export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  try {
    const settings = await gateways.settings.update(patch);
    useSettingsStore.getState().setSettings(settings);
    return settings;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function saveTriggerPosition(ratio: number): Promise<Settings> {
  try {
    const settings = await gateways.settings.setTriggerPosition(ratio);
    useSettingsStore.getState().setSettings(settings);
    return settings;
  } catch (err) {
    throw toAppError(err);
  }
}
