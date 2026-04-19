import { create } from "zustand";
import type { DailySummary } from "../models/DailySummary";
import type { UnlockStatus } from "../commands/types";
import { DEFAULT_UNLOCK_STATUS } from "../lib/unlock";

type HeaderPointsFlash = {
  amount: number;
  /** flash 期間要顯示的 pending 舊值 */
  oldPending: number;
  id: number;
};

type UIState = {
  isPanelOpen: boolean;
  isTaskDetailOpen: boolean;
  selectedTaskId: string | null;
  allTasksCompleted: boolean;
  isPreviousDaySummaryOpen: boolean;
  previousDaySummary: DailySummary | null;
  unlocks: UnlockStatus;
  taskCompletionFlash: {
    taskTitle: string;
    pointsEarned: number;
  } | null;
  isUnlockTreeOpen: boolean;
  headerPointsFlash: HeaderPointsFlash | null;
  isComposingTask: boolean;
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
  showTaskCompletionFlash: (taskTitle: string, pointsEarned: number) => void;
  hideTaskCompletionFlash: () => void;
  openUnlockTree: () => void;
  closeUnlockTree: () => void;
  /**
   * 觸發 header 的 +N flash。
   * @param amount 新增的點數
   * @param oldPending flash 期間應該顯示的 pending 舊值(通常由呼叫端在 sync wallet 前 snapshot)
   */
  triggerHeaderPointsFlash: (amount: number, oldPending: number) => void;
  clearHeaderPointsFlash: () => void;
  setComposingTask: (value: boolean) => void;
};

let _headerFlashSeq = 0;

export const useUIStore = create<UIState & UIActions>((set) => ({
  isPanelOpen: false,
  isTaskDetailOpen: false,
  selectedTaskId: null,
  allTasksCompleted: false,
  isPreviousDaySummaryOpen: false,
  previousDaySummary: null,
  unlocks: DEFAULT_UNLOCK_STATUS,
  taskCompletionFlash: null,
  isUnlockTreeOpen: false,
  headerPointsFlash: null,
  isComposingTask: false,

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
  showTaskCompletionFlash: (taskTitle, pointsEarned) =>
    set({ taskCompletionFlash: { taskTitle, pointsEarned } }),
  hideTaskCompletionFlash: () =>
    set({ taskCompletionFlash: null }),
  openUnlockTree: () => set({ isUnlockTreeOpen: true }),
  closeUnlockTree: () => set({ isUnlockTreeOpen: false }),

  triggerHeaderPointsFlash: (amount, oldPending) => {
    _headerFlashSeq += 1;
    set({ headerPointsFlash: { amount, oldPending, id: _headerFlashSeq } });
  },
  clearHeaderPointsFlash: () => set({ headerPointsFlash: null }),

  setComposingTask: (value) => set({ isComposingTask: value }),
}));