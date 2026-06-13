import { create } from "zustand";
import type { DailySummary } from "../../core/types";

/**
 * 純 UI 旗標。零副作用 — 視窗 resize 在 windowManager,
 * 開關流程協調在 orchestrators/windowFlow。
 */

type HeaderPointsFlash = {
  amount: number;
  oldPending: number;
  id: number;
};

type TaskCompletionFlash = {
  taskTitle: string;
  pointsEarned: number;
};

type UIState = {
  isPanelOpen: boolean;
  isWindowTransitioning: boolean;
  isTaskDetailOpen: boolean;
  selectedTaskId: string | null;
  isSettingsOpen: boolean;
  isUnlockTreeOpen: boolean;
  isUnlockTreeClosing: boolean;
  isUnlockMaximized: boolean;
  isPreviousDaySummaryOpen: boolean;
  previousDaySummary: DailySummary | null;
  taskCompletionFlash: TaskCompletionFlash | null;
  headerPointsFlash: HeaderPointsFlash | null;
  isComposingTask: boolean;
};

type UIActions = {
  setPanelOpen: (value: boolean) => void;
  setWindowTransitioning: (value: boolean) => void;
  setUnlockTreeOpen: (value: boolean) => void;
  setUnlockTreeClosing: (value: boolean) => void;
  setUnlockMaximized: (value: boolean) => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  showPreviousDaySummary: (summary: DailySummary | null) => void;
  closePreviousDaySummary: () => void;
  showTaskCompletionFlash: (taskTitle: string, pointsEarned: number) => void;
  hideTaskCompletionFlash: () => void;
  triggerHeaderPointsFlash: (amount: number, oldPending: number) => void;
  clearHeaderPointsFlash: () => void;
  setComposingTask: (value: boolean) => void;
};

let headerFlashSeq = 0;

export const useUIStore = create<UIState & UIActions>((set) => ({
  isPanelOpen: false,
  isWindowTransitioning: false,
  isTaskDetailOpen: false,
  selectedTaskId: null,
  isSettingsOpen: false,
  isUnlockTreeOpen: false,
  isUnlockTreeClosing: false,
  isUnlockMaximized: false,
  isPreviousDaySummaryOpen: false,
  previousDaySummary: null,
  taskCompletionFlash: null,
  headerPointsFlash: null,
  isComposingTask: false,

  setPanelOpen: (value) => set({ isPanelOpen: value }),
  setWindowTransitioning: (value) => set({ isWindowTransitioning: value }),
  setUnlockTreeOpen: (value) => set({ isUnlockTreeOpen: value }),
  setUnlockTreeClosing: (value) => set({ isUnlockTreeClosing: value }),
  setUnlockMaximized: (value) => set({ isUnlockMaximized: value }),

  openTaskDetail: (taskId) =>
    set({ isTaskDetailOpen: true, selectedTaskId: taskId }),
  closeTaskDetail: () => set({ isTaskDetailOpen: false, selectedTaskId: null }),

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  showPreviousDaySummary: (summary) =>
    set({ isPreviousDaySummaryOpen: true, previousDaySummary: summary }),
  closePreviousDaySummary: () =>
    set({ isPreviousDaySummaryOpen: false, previousDaySummary: null }),

  showTaskCompletionFlash: (taskTitle, pointsEarned) =>
    set({ taskCompletionFlash: { taskTitle, pointsEarned } }),
  hideTaskCompletionFlash: () => set({ taskCompletionFlash: null }),

  triggerHeaderPointsFlash: (amount, oldPending) => {
    headerFlashSeq += 1;
    set({ headerPointsFlash: { amount, oldPending, id: headerFlashSeq } });
  },
  clearHeaderPointsFlash: () => set({ headerPointsFlash: null }),

  setComposingTask: (value) => set({ isComposingTask: value }),
}));
