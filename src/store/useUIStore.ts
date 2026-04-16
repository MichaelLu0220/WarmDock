import { create } from "zustand";

type UIState = {
  isPanelOpen: boolean;
  isTaskDetailOpen: boolean;
  selectedTaskId: string | null;
  allTasksCompleted: boolean;
};

type UIActions = {
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  setAllTasksCompleted: (value: boolean) => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  isPanelOpen: false,
  isTaskDetailOpen: false,
  selectedTaskId: null,
  allTasksCompleted: false,

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setAllTasksCompleted: (value) => set({ allTasksCompleted: value }),

  openTaskDetail: (taskId: string) =>
    set({ isTaskDetailOpen: true, selectedTaskId: taskId }),

  closeTaskDetail: () =>
    set({ isTaskDetailOpen: false, selectedTaskId: null }),
}));