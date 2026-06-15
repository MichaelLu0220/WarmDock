import { create } from "zustand";
import type { DailySummary } from "@warmdock/core/types";

/** 啟動狀態 + 今日週期狀態(日期、摘要、是否全完成) */
type SessionState = {
  isBootstrapping: boolean;
  isReady: boolean;
  bootstrapError: string | null;
  /** True when showing cached data because the authoritative server is unreachable. */
  isOffline: boolean;
  /** True when today's cycle is already settled (day over; no new tasks). */
  isDaySettled: boolean;
  today: string | null;
  todaySummary: DailySummary | null;
  allTasksCompleted: boolean;
};

type SessionActions = {
  startBootstrap: () => void;
  finishBootstrap: () => void;
  failBootstrap: (message: string) => void;
  setOffline: (value: boolean) => void;
  setDaySettled: (value: boolean) => void;
  setToday: (date: string) => void;
  setTodaySummary: (summary: DailySummary | null) => void;
  setAllTasksCompleted: (value: boolean) => void;
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  isBootstrapping: false,
  isReady: false,
  bootstrapError: null,
  isOffline: false,
  isDaySettled: false,
  today: null,
  todaySummary: null,
  allTasksCompleted: false,

  startBootstrap: () =>
    set({ isBootstrapping: true, isReady: false, bootstrapError: null }),
  finishBootstrap: () => set({ isBootstrapping: false, isReady: true }),
  failBootstrap: (message) =>
    set({ isBootstrapping: false, isReady: false, bootstrapError: message }),

  setOffline: (value) => set({ isOffline: value }),
  setDaySettled: (value) => set({ isDaySettled: value }),
  setToday: (date) => set({ today: date }),
  setTodaySummary: (summary) => set({ todaySummary: summary }),
  setAllTasksCompleted: (value) => set({ allTasksCompleted: value }),
}));
