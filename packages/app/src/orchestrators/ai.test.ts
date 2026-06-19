import { describe, expect, it } from "vitest";
import type { UiGateways } from "../client";
import { configureGateways } from "../client";
import { analyzeTaskProposal } from "./ai";

const baseGateways: Omit<UiGateways, "ai"> = {
  task: {} as UiGateways["task"],
  session: {} as UiGateways["session"],
  unlock: {} as UiGateways["unlock"],
  settings: {} as UiGateways["settings"],
};

describe("analyzeTaskProposal", () => {
  it("uses local fallback when no ai gateway is configured", async () => {
    configureGateways(baseGateways);

    await expect(analyzeTaskProposal("deploy production")).resolves.toMatchObject({
      originalText: "deploy production",
      suggestedBand: "hard",
      suggestedScore: 4,
      available: false,
    });
  });

  it("returns the configured ai gateway result", async () => {
    configureGateways({
      ...baseGateways,
      ai: {
        async analyzeTaskProposal(title) {
          return {
            originalText: title,
            suggestedCorrection: "Clean the desk",
            suggestedBand: "easy",
            suggestedScore: 2,
            reason: "Mock analysis.",
            available: true,
          };
        },
      },
    });

    await expect(analyzeTaskProposal("Clena the desk")).resolves.toMatchObject({
      suggestedCorrection: "Clean the desk",
      suggestedBand: "easy",
      suggestedScore: 2,
      available: true,
    });
  });

  it("falls back when the configured ai gateway throws", async () => {
    configureGateways({
      ...baseGateways,
      ai: {
        async analyzeTaskProposal() {
          throw new Error("WarmAI down");
        },
      },
    });

    await expect(analyzeTaskProposal("reply to email")).resolves.toMatchObject({
      suggestedBand: "easy",
      suggestedScore: 2,
      available: false,
    });
  });
});
