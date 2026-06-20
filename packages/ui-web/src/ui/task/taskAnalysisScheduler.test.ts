import { describe, expect, it, vi } from "vitest";
import type { AiAnalysis } from "@warmdock/api";
import { scheduleTaskAnalysis, TASK_ANALYSIS_DEBOUNCE_MS } from "./taskAnalysisScheduler";

const analysis: AiAnalysis = {
  originalText: "clean room",
  suggestedCorrection: null,
  suggestedBand: "easy",
  suggestedScore: 2,
  reason: "Mock analysis.",
  available: true,
};

describe("scheduleTaskAnalysis", () => {
  it("debounces typing and only analyzes the last settled title", async () => {
    vi.useFakeTimers();
    const analyze = vi.fn(async () => analysis);
    const onAnalysis = vi.fn();
    const onSelectedScore = vi.fn();
    const onAnalyzingChange = vi.fn();

    const cancelFirst = scheduleTaskAnalysis({
      title: "c",
      analyze,
      onAnalysis,
      onSelectedScore,
      onAnalyzingChange,
    });
    cancelFirst();

    scheduleTaskAnalysis({
      title: "clean room",
      analyze,
      onAnalysis,
      onSelectedScore,
      onAnalyzingChange,
    });

    await vi.advanceTimersByTimeAsync(TASK_ANALYSIS_DEBOUNCE_MS - 1);
    expect(analyze).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();

    expect(analyze).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledWith("clean room");
    expect(onAnalysis).toHaveBeenCalledWith(analysis);
    expect(onSelectedScore).toHaveBeenCalledWith(2);
    vi.useRealTimers();
  });
});
