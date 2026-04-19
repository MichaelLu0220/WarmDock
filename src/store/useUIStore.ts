import { create } from "zustand";
import type { DailySummary } from "../models/DailySummary";
import type { UnlockStatus } from "../commands/types";
import { DEFAULT_UNLOCK_STATUS } from "../lib/unlock";
import {
  enterPanelMode,
  enterTriggerMode,
  enterConfiguratorMode,
} from "../lib/windowMode";

type HeaderPointsFlash = {
  amount: number;
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
  openPanel: () => Promise<void>;
  closePanel: () => Promise<void>;
  togglePanel: () => Promise<void>;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  setAllTasksCompleted: (value: boolean) => void;
  showPreviousDaySummary: (summary: DailySummary | null) => void;
  closePreviousDaySummary: () => void;
  setUnlocks: (unlocks: UnlockStatus) => void;
  showTaskCompletionFlash: (taskTitle: string, pointsEarned: number) => void;
  hideTaskCompletionFlash: () => void;
  openUnlockTree: () => Promise<void>;
  closeUnlockTree: () => Promise<void>;
  triggerHeaderPointsFlash: (amount: number, oldPending: number) => void;
  clearHeaderPointsFlash: () => void;
  setComposingTask: (value: boolean) => void;
};

let _headerFlashSeq = 0;

export const useUIStore = create<UIState & UIActions>((set, get) => ({
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

  openPanel: async () => {
    // 先 resize 再 set state,避免 panel 被裁切
    await enterPanelMode();
    set({ isPanelOpen: true });
  },

  closePanel: async () => {
    set({ isPanelOpen: false });
    // 等 CSS 滑出動畫結束再縮 window,畫面比較順
    setTimeout(() => {
      enterTriggerMode().catch((e) =>
        console.error("closePanel resize failed", e)
      );
    }, 220);
  },

  togglePanel: async () => {
    if (get().isPanelOpen) {
      await get().closePanel();
    } else {
      await get().openPanel();
    }
  },

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

  openUnlockTree: async () => {
    // 先放大 window 再顯示配置器
    await enterConfiguratorMode();
    set({ isUnlockTreeOpen: true });
  },

  closeUnlockTree: async () => {
    set({ isUnlockTreeOpen: false });
    // 配置器關閉後回到 panel mode(panel 還是開的)
    await enterPanelMode();
  },

  triggerHeaderPointsFlash: (amount, oldPending) => {
    _headerFlashSeq += 1;
    set({ headerPointsFlash: { amount, oldPending, id: _headerFlashSeq } });
  },
  clearHeaderPointsFlash: () => set({ headerPointsFlash: null }),

  setComposingTask: (value) => set({ isComposingTask: value }),
}));