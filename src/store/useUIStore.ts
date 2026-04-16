import { create } from "zustand";
import type { DailySummary } from "../models/DailySummary";

type UIState = {
  isPanelOpen: boolean;
  isTaskDetailOpen: boolean;
  selectedTaskId: string | null;
  allTasksCompleted: boolean;
  isPreviousDaySummaryOpen: boolean;
  previousDaySummary: DailySummary | null;
  unlockMaxSlots: number;  // 新增，從 bootstrap 讀取
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
  setUnlockMaxSlots: (n: number) => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  isPanelOpen: false,
  isTaskDetailOpen: false,
  selectedTaskId: null,
  allTasksCompleted: false,
  isPreviousDaySummaryOpen: false,
  previousDaySummary: null,
  unlockMaxSlots: 3,

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
  setUnlockMaxSlots: (n) => set({ unlockMaxSlots: n }),
}));