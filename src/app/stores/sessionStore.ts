import { create } from "zustand";
import type { DailySummary } from "../../core/types";

/** 啟動狀態 + 今日週期狀態(日期、摘要、是否全完成) */
type SessionState = {
  isBootstrapping: boolean;
  isReady: boolean;
  bootstrapError: string | null;
  today: string | null;
  todaySummary: DailySummary | null;
  allTasksCompleted: boolean;
};

type SessionActions = {
  startBootstrap: () => void;
  finishBootstrap: () => void;
  failBootstrap: (message: string) => void;
  setToday: (date: string) => void;
  setTodaySummary: (summary: DailySummary | null) => void;
  setAllTasksCompleted: (value: boolean) => void;
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  isBootstrapping: false,
  isReady: false,
  bootstrapError: null,
  today: null,
  todaySummary: null,
  allTasksCompleted: false,

  startBootstrap: () =>
    set({ isBootstrapping: true, isReady: false, bootstrapError: null }),
  finishBootstrap: () => set({ isBootstrapping: false, isReady: true }),
  failBootstrap: (message) =>
    set({ isBootstrapping: false, isReady: false, bootstrapError: message }),

  setToday: (date) => set({ today: date }),
  setTodaySummary: (summary) => set({ todaySummary: summary }),
  setAllTasksCompleted: (value) => set({ allTasksCompleted: value }),
}));
