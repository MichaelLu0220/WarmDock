import { create } from "zustand";
import type { DailySummary } from "../models/DailySummary";
import type { CompleteTaskResponse } from "../commands/types";

type SummaryState = {
  todaySummary: DailySummary | null;
};

type SummaryActions = {
  setSummary: (summary: DailySummary) => void;
  syncSummaryAfterCompletion: (result: CompleteTaskResponse) => void;
};

export const useSummaryStore = create<SummaryState & SummaryActions>((set) => ({
  todaySummary: null,

  setSummary: (summary) => set({ todaySummary: summary }),

  syncSummaryAfterCompletion: (result) =>
    set({ todaySummary: result.today_summary }),
}));