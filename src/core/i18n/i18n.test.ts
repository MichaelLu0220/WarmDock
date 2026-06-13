import { describe, expect, it } from "vitest";
import { difficultyBandLabel, errorMessage, t } from "./index";

describe("i18n", () => {
  it("interpolates params", () => {
    expect(t("header.streakDays", { days: 5 })).toBe("5 天");
    expect(t("app.bootstrapFailed", { message: "x" })).toContain("x");
  });

  it("maps error codes", () => {
    expect(errorMessage("INSUFFICIENT_POINTS")).toBe("點數不足");
    expect(errorMessage("UNKNOWN")).toBe("發生未知錯誤");
  });

  it("maps difficulty bands", () => {
    expect(difficultyBandLabel("easy")).toBe("簡單");
    expect(difficultyBandLabel("hard")).toBe("困難");
  });
});
