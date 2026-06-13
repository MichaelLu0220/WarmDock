import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import {
  canComplete,
  DIFFICULTY_OPTIONS,
  getDefaultScoreForBand,
  isCompleted,
  needsSetup,
  suggestDifficulty,
} from "./task";

function task(status: Task["status"]): Task {
  return {
    id: "t1",
    title: "x",
    targetDate: "2026-06-12",
    createdAt: "",
    updatedAt: "",
    sortOrder: 0,
    status,
    completedAt: null,
    difficulty: null,
    difficultySuggested: null,
    basePoints: 0,
    finalRewardPoints: 0,
    isFocus: false,
  };
}

describe("task status rules", () => {
  it("maps status to ui predicates", () => {
    expect(needsSetup(task("draft"))).toBe(true);
    expect(canComplete(task("draft"))).toBe(false);
    expect(canComplete(task("ready"))).toBe(true);
    expect(isCompleted(task("completed"))).toBe(true);
    expect(canComplete(task("completed"))).toBe(false);
  });
});

describe("difficulty suggestion", () => {
  it("keyword rules", () => {
    expect(suggestDifficulty("寫季度報告")).toBe("hard");
    expect(suggestDifficulty("買牛奶")).toBe("easy");
    expect(suggestDifficulty("整理桌面")).toBe("medium");
  });

  it("default score is the middle option", () => {
    for (const band of ["easy", "medium", "hard"] as const) {
      expect(DIFFICULTY_OPTIONS[band]).toContain(getDefaultScoreForBand(band));
    }
  });
});
