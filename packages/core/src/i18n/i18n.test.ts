import { afterEach, describe, expect, it } from "vitest";
import { en, MANTRAS_EN } from "./en";
import { difficultyBandLabel, errorMessage, getLocale, setLocale, t } from "./index";
import { MANTRAS_ZH_TW, zhTW } from "./zh-TW";

// Default locale is zh-TW; restore it after any test that switches.
afterEach(() => setLocale("zh-TW"));

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

  it("selects strings by active locale", () => {
    expect(getLocale()).toBe("zh-TW");
    expect(t("ceremony.flashTitle")).toBe("完成一項承諾。");
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("ceremony.flashTitle")).toBe("A promise kept.");
  });

  it("keeps en and zh-TW dictionaries at key parity", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zhTW).sort());
  });

  it("has no untranslated (empty) entries in either dictionary", () => {
    for (const [key, value] of Object.entries(zhTW)) {
      expect(value, `zh-TW.${key}`).not.toBe("");
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key}`).not.toBe("");
    }
  });

  it("provides a matching mantra pool per locale", () => {
    expect(MANTRAS_ZH_TW.length).toBeGreaterThan(0);
    expect(MANTRAS_EN.length).toBe(MANTRAS_ZH_TW.length);
  });
});
