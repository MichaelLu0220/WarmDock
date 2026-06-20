import { describe, expect, it } from "vitest";
import { resolveTaskSuggestion } from "./aiSuggestion";

describe("resolveTaskSuggestion", () => {
  it("uses local fallback while AI is pending", () => {
    expect(resolveTaskSuggestion("deploy production", null)).toEqual({
      suggestedBand: "hard",
      suggestedScore: null,
      aiAvailable: false,
      sourceLabel: null,
    });
  });

  it("uses AI score and band when available", () => {
    expect(
      resolveTaskSuggestion("Clena the desk", {
        originalText: "Clena the desk",
        suggestedCorrection: "Clean the desk",
        suggestedBand: "easy",
        suggestedScore: 2,
        reason: "Mock analysis.",
        available: true,
      })
    ).toEqual({
      suggestedBand: "easy",
      suggestedScore: 2,
      aiAvailable: true,
      sourceLabel: "by WarmAI",
    });
  });

  it("keeps local fallback when AI is unavailable", () => {
    expect(
      resolveTaskSuggestion("reply to email", {
        originalText: "reply to email",
        suggestedCorrection: null,
        suggestedBand: "medium",
        suggestedScore: 3,
        reason: "WarmAI down.",
        available: false,
      })
    ).toEqual({
      suggestedBand: "easy",
      suggestedScore: null,
      aiAvailable: false,
      sourceLabel: null,
    });
  });
});
