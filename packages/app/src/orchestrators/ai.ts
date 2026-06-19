import type { AiAnalysis } from "@warmdock/api";
import { getDefaultScoreForBand, suggestDifficulty } from "@warmdock/core/rules/task";
import { getGateways } from "../client";

function fallback(title: string): AiAnalysis {
  const suggestedBand = suggestDifficulty(title);
  return {
    originalText: title,
    suggestedCorrection: null,
    suggestedBand,
    suggestedScore: getDefaultScoreForBand(suggestedBand),
    reason: "AI analysis is unavailable; you can still confirm this task.",
    available: false,
  };
}

export async function analyzeTaskProposal(title: string): Promise<AiAnalysis> {
  const ai = getGateways().ai;
  if (!ai) return fallback(title);

  try {
    return await ai.analyzeTaskProposal(title);
  } catch {
    return fallback(title);
  }
}
