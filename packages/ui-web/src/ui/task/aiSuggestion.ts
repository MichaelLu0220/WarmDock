import type { AiAnalysis } from "@warmdock/api";
import type { Difficulty, DifficultyBand } from "@warmdock/core";
import { suggestDifficulty } from "@warmdock/core/rules/task";

export interface TaskSuggestionState {
  suggestedBand: DifficultyBand;
  suggestedScore: Difficulty | null;
  aiAvailable: boolean;
  sourceLabel: "by WarmAI" | null;
}

export function resolveTaskSuggestion(
  title: string,
  analysis: AiAnalysis | null
): TaskSuggestionState {
  if (analysis?.available) {
    return {
      suggestedBand: analysis.suggestedBand,
      suggestedScore: analysis.suggestedScore,
      aiAvailable: true,
      sourceLabel: "by WarmAI",
    };
  }

  return {
    suggestedBand: suggestDifficulty(title),
    suggestedScore: null,
    aiAvailable: false,
    sourceLabel: null,
  };
}
