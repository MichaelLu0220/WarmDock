import { describe, expect, it } from "vitest";
import type { Wallet } from "../types";
import {
  availablePoints,
  formatPendingSuffix,
  formatPoints,
  formatPointsDelta,
  formatWalletDisplay,
} from "./points";

const wallet: Wallet = {
  walletPoints: 100,
  pendingTodayPoints: 10,
  streakDays: 0,
  lastCompletedDate: null,
  lastRolloverDate: null,
  bestStreakDays: 0,
  lifetimePointsEarned: 0,
  pointsSpentOnUnlocks: 0,
  pendingTodayUnlockSpent: 3,
};

describe("points", () => {
  it("available = wallet + pending - todaySpend(鏡像後端)", () => {
    expect(availablePoints(wallet)).toBe(107);
  });

  it("formatting", () => {
    expect(formatPoints(12)).toBe("12");
    expect(formatPoints(-3)).toBe("0");
    expect(formatPoints(NaN)).toBe("0");
    expect(formatPointsDelta(5)).toBe("+5");
    expect(formatPendingSuffix(0)).toBeNull();
    expect(formatPendingSuffix(3)).toBe("(+3)");
    expect(formatWalletDisplay(10, 3)).toEqual({ main: "10", suffix: "(+3)" });
    expect(formatWalletDisplay(10, 0)).toEqual({ main: "10", suffix: null });
  });
});
