import { describe, expect, it } from "vitest";
import { createLocalWarmAiGateway, scoreToBand } from "./warmai";

describe("scoreToBand", () => {
  it("maps WarmAI scores to WarmDock bands", () => {
    expect(scoreToBand(1)).toBe("easy");
    expect(scoreToBand(2)).toBe("easy");
    expect(scoreToBand(3)).toBe("medium");
    expect(scoreToBand(4)).toBe("hard");
    expect(scoreToBand(5)).toBe("hard");
  });
});

describe("createLocalWarmAiGateway", () => {
  it("posts to WarmAI and maps a valid response", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ input, init });
      return new Response(
        JSON.stringify({
          status: "ok",
          result: {
            suggested_text: "Clean the desk",
            score: 2,
            reason: "Mock analysis.",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    const gateway = createLocalWarmAiGateway({
      baseUrl: "http://127.0.0.1:8000",
      apiKey: "dev-secret",
      fetcher,
      requestIdFactory: () => "123e4567-e89b-42d3-a456-426614174000",
    });

    const analysis = await gateway.analyzeTaskProposal("Clena the desk");

    expect(analysis).toEqual({
      originalText: "Clena the desk",
      suggestedCorrection: "Clean the desk",
      suggestedBand: "easy",
      suggestedScore: 2,
      reason: "Mock analysis.",
      available: true,
    });
    expect(String(calls[0].input)).toBe("http://127.0.0.1:8000/v1/task-analysis");
    expect(calls[0].init?.headers).toMatchObject({
      "Content-Type": "application/json",
      "X-API-Key": "dev-secret",
      "Idempotency-Key": "123e4567-e89b-42d3-a456-426614174000",
    });
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      text: "Clena the desk",
      client_request_id: "123e4567-e89b-42d3-a456-426614174000",
    });
  });

  it("returns a medium fallback when WarmAI is unavailable", async () => {
    const fetcher: typeof fetch = async () => {
      throw new TypeError("connection refused");
    };
    const gateway = createLocalWarmAiGateway({ fetcher });

    await expect(gateway.analyzeTaskProposal("Write report")).resolves.toEqual({
      originalText: "Write report",
      suggestedCorrection: null,
      suggestedBand: "medium",
      suggestedScore: 3,
      reason: "WarmAI analysis is unavailable; you can still confirm this task.",
      available: false,
    });
  });
});
