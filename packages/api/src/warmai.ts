import type { Difficulty, DifficultyBand } from "@warmdock/core";
import type { AiGateway } from "./ports";
import type { AiAnalysis } from "./types";

interface WarmAiResponse {
  status?: string;
  result?: {
    suggested_text?: string | null;
    score?: number;
    reason?: string;
  };
}

export interface LocalWarmAiGatewayConfig {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  requestIdFactory?: () => string;
}

export function scoreToBand(score: Difficulty): DifficultyBand {
  if (score <= 2) return "easy";
  if (score === 3) return "medium";
  return "hard";
}

function fallback(title: string): AiAnalysis {
  return {
    originalText: title,
    suggestedCorrection: null,
    suggestedBand: "medium",
    suggestedScore: 3,
    reason: "WarmAI analysis is unavailable; you can still confirm this task.",
    available: false,
  };
}

function isDifficulty(score: number | undefined): score is Difficulty {
  return score === 1 || score === 2 || score === 3 || score === 4 || score === 5;
}

export function createLocalWarmAiGateway(config: LocalWarmAiGatewayConfig = {}): AiGateway {
  const baseUrl = config.baseUrl ?? "http://127.0.0.1:8000";
  const apiKey = config.apiKey ?? "dev-secret";
  const timeoutMs = config.timeoutMs ?? 5000;
  const fetcher = config.fetcher ?? fetch;
  const requestIdFactory = config.requestIdFactory ?? (() => crypto.randomUUID());

  return {
    async analyzeTaskProposal(title) {
      const requestId = requestIdFactory();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/v1/task-analysis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            "Idempotency-Key": requestId,
          },
          body: JSON.stringify({ text: title, client_request_id: requestId }),
          signal: controller.signal,
        });
        if (!response.ok) return fallback(title);

        const body = (await response.json()) as WarmAiResponse;
        const score = body.result?.score;
        if (!body.result || !isDifficulty(score)) return fallback(title);
        if (body.status !== "ok" && body.status !== "degraded") return fallback(title);

        return {
          originalText: title,
          suggestedCorrection: body.result.suggested_text ?? null,
          suggestedBand: scoreToBand(score),
          suggestedScore: score,
          reason: body.result.reason ?? "",
          available: true,
        };
      } catch {
        return fallback(title);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
