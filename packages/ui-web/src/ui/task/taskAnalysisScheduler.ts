import type { AiAnalysis } from "@warmdock/api";
import type { Difficulty } from "@warmdock/core";

export const TASK_ANALYSIS_DEBOUNCE_MS = 700;

type TimeoutId = ReturnType<typeof setTimeout>;

export interface TaskAnalysisScheduleOptions {
  title: string;
  analyze: (title: string) => Promise<AiAnalysis>;
  onAnalysis: (analysis: AiAnalysis) => void;
  onSelectedScore: (score: Difficulty) => void;
  onAnalyzingChange: (isAnalyzing: boolean) => void;
  delayMs?: number;
  setTimeoutFn?: (handler: () => void, timeout: number) => TimeoutId;
  clearTimeoutFn?: (id: TimeoutId) => void;
}

export function scheduleTaskAnalysis(options: TaskAnalysisScheduleOptions): () => void {
  const {
    title,
    analyze,
    onAnalysis,
    onSelectedScore,
    onAnalyzingChange,
    delayMs = TASK_ANALYSIS_DEBOUNCE_MS,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  } = options;
  const trimmed = title.trim();
  let cancelled = false;

  if (!trimmed) {
    onAnalyzingChange(false);
    return () => {
      cancelled = true;
    };
  }

  onAnalyzingChange(true);
  const timeoutId = setTimeoutFn(() => {
    void analyze(trimmed)
      .then((result) => {
        if (cancelled) return;
        onAnalysis(result);
        if (result.available) onSelectedScore(result.suggestedScore);
      })
      .finally(() => {
        if (!cancelled) onAnalyzingChange(false);
      });
  }, delayMs);

  return () => {
    cancelled = true;
    clearTimeoutFn(timeoutId);
  };
}
