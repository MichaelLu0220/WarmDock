import { create } from "zustand";
import type { DailySummary } from "../models/DailySummary";
import type { UnlockStatus } from "../commands/types";
import { DEFAULT_UNLOCK_STATUS } from "../lib/unlock";

type UIState = {
  isPanelOpen: boolean;
  isTaskDetailOpen: boolean;
  selectedTaskId: string | null;
  allTasksCompleted: boolean;
  isPreviousDaySummaryOpen: boolean;
  previousDaySummary: DailySummary | null;
  unlocks: UnlockStatus;
};

type UIActions = {
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  setAllTasksCompleted: (value: boolean) => void;
  showPreviousDaySummary: (summary: DailySummary | null) => void;
  closePreviousDaySummary: () => void;
  setUnlocks: (unlocks: UnlockStatus) => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  isPanelOpen: false,
  isTaskDetailOpen: false,
  selectedTaskId: null,
  allTasksCompleted: false,
  isPreviousDaySummaryOpen: false,
  previousDaySummary: null,
  unlocks: DEFAULT_UNLOCK_STATUS,

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setAllTasksCompleted: (value) => set({ allTasksCompleted: value }),

  openTaskDetail: (taskId: string) =>
    set({ isTaskDetailOpen: true, selectedTaskId: taskId }),

  closeTaskDetail: () =>
    set({ isTaskDetailOpen: false, selectedTaskId: null }),
	
  showPreviousDaySummary: (summary) =>
    set({ isPreviousDaySummaryOpen: true, previousDaySummary: summary }),
  closePreviousDaySummary: () =>
    set({ isPreviousDaySummaryOpen: false, previousDaySummary: null }),
  setUnlocks: (unlocks) => set({ unlocks }),
}));