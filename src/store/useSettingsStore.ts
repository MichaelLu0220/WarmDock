import { create } from "zustand";
import type { UserSettings } from "../models/UserSettings";
import { saveUserSettings, saveTriggerPosition } from "../services/settingsService";
import type {
  UpdateUserSettingsArgs,
  UpdateTriggerPositionArgs,
} from "../commands/types";

type SettingsState = {
  settings: UserSettings | null;
};

type SettingsActions = {
  setSettings: (settings: UserSettings) => void;
  updateSettings: (args: UpdateUserSettingsArgs) => Promise<void>;
  setTriggerPosition: (args: UpdateTriggerPositionArgs) => Promise<void>;
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  settings: null,

  setSettings: (settings) => set({ settings }),

  updateSettings: async (args) => {
    const updated = await saveUserSettings(args);
    set({ settings: updated });
  },

  setTriggerPosition: async (args) => {
    const updated = await saveTriggerPosition(args);
    set({ settings: updated });
  },
}));