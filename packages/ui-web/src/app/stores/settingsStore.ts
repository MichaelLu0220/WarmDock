import { create } from "zustand";
import type { Settings } from "@warmdock/core/types";

type SettingsState = {
  settings: Settings | null;
};

type SettingsActions = {
  setSettings: (settings: Settings) => void;
};

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set) => ({
    settings: null,
    setSettings: (settings) => set({ settings }),
  })
);
