import type { SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty, DifficultyBand } from "@warmdock/core";
import type { AiGateway } from "./ports";
import type { AiAnalysis } from "./types";

interface AiEdgeResponse {
  suggested_correction?: string | null;
  suggested_band?: DifficultyBand;
  suggested_score?: Difficulty;
  reason?: string;
}

/**
 * Calls the server-side `ai-analyze-task` Edge Function (which holds the API key
 * and enforces the 5s timeout). On any failure the requirement is to never block
 * task creation — we return the medium / score 3 fallback instead of throwing.
 */
export function createAiGateway(sb: SupabaseClient): AiGateway {
  return {
    async analyzeTaskProposal(title) {
      const fallback: AiAnalysis = {
        originalText: title,
        suggestedCorrection: null,
        suggestedBand: "medium",
        suggestedScore: 3,
        reason: "AI analysis is unavailable; you can still confirm this task.",
        available: false,
      };
      try {
        const { data, error } = await sb.functions.invoke<AiEdgeResponse>("ai-analyze-task", {
          body: { title },
        });
        if (error || !data) return fallback;
        return {
          originalText: title,
          suggestedCorrection: data.suggested_correction ?? null,
          suggestedBand: data.suggested_band ?? "medium",
          suggestedScore: data.suggested_score ?? 3,
          reason: data.reason ?? "",
          available: true,
        };
      } catch {
        return fallback;
      }
    },
  };
}
