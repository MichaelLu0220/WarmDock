import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CompleteTaskResult,
  PurchaseUnlockResult,
  Task,
  UnlockProgress,
  Wallet,
} from "../../core/types";

// mock 掉 data 組裝點 — orchestrator 測試不碰 Tauri
vi.mock("../../data", () => ({
  gateways: {
    task: {
      listToday: vi.fn(),
      create: vi.fn(),
      setDetail: vi.fn(),
      complete: vi.fn(),
    },
    session: { bootstrap: vi.fn(), runDailyRefreshIfNeeded: vi.fn() },
    unlock: { progress: vi.fn(), purchase: vi.fn() },
    settings: { update: vi.fn(), setTriggerPosition: vi.fn() },
    dev: { forceDailyRefresh: vi.fn(), resetAllData: vi.fn() },
  },
}));

import { gateways } from "../../data";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";
import { completeTask } from "./tasks";
import { purchaseUnlock } from "./unlocks";

const baseTask: Task = {
  id: "t1",
  title: "x",
  targetDate: "2026-06-12",
  createdAt: "",
  updatedAt: "",
  sortOrder: 0,
  status: "ready",
  completedAt: null,
  difficulty: 3,
  difficultySuggested: null,
  basePoints: 3,
  finalRewardPoints: 4,
  isFocus: true,
};

const baseWallet: Wallet = {
  walletPoints: 10,
  pendingTodayPoints: 0,
  streakDays: 1,
  lastCompletedDate: null,
  lastRolloverDate: null,
  bestStreakDays: 1,
  lifetimePointsEarned: 20,
  pointsSpentOnUnlocks: 0,
  pendingTodayUnlockSpent: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  useTaskStore.setState({ tasks: [baseTask], isLoading: false, error: null });
  useWalletStore.setState({ wallet: baseWallet });
  useSessionStore.setState({ todaySummary: null });
});

describe("completeTask orchestrator", () => {
  it("一個 response 同步 task + wallet + summary", async () => {
    const result: CompleteTaskResult = {
      task: { ...baseTask, status: "completed", completedAt: "now" },
      rewardEarned: 3,
      bonusEarned: 1,
      pendingTodayPoints: 4,
      walletPoints: 10,
      todaySummary: {
        date: "2026-06-12",
        tasksCreated: 1,
        tasksCompleted: 1,
        focusTasksCompleted: 1,
        pointsEarned: 4,
        isAllCompleted: false,
      },
      allTasksCompleted: false,
      streakDays: 1,
      availablePointsDelta: 4,
      availablePointsAfter: 14,
    };
    vi.mocked(gateways.task.complete).mockResolvedValue(result);

    await completeTask("t1");

    expect(useTaskStore.getState().tasks[0].status).toBe("completed");
    const wallet = useWalletStore.getState().wallet!;
    expect(wallet.pendingTodayPoints).toBe(4);
    expect(wallet.lifetimePointsEarned).toBe(24);
    expect(useSessionStore.getState().todaySummary?.tasksCompleted).toBe(1);
  });

  it("失敗時不動任何 store,error 進 taskStore", async () => {
    vi.mocked(gateways.task.complete).mockRejectedValue(new Error("boom"));

    await expect(completeTask("t1")).rejects.toThrow("boom");

    expect(useTaskStore.getState().tasks[0].status).toBe("ready");
    expect(useWalletStore.getState().wallet?.pendingTodayPoints).toBe(0);
    expect(useTaskStore.getState().error).toBe("boom");
  });
});

describe("purchaseUnlock orchestrator", () => {
  it("status + wallet + progress 一致更新", async () => {
    const result: PurchaseUnlockResult = {
      nodeId: "slots.4",
      unlocks: {
        maxVisibleTaskSlots: 4,
        focusTaskFeatureUnlocked: false,
        customRefreshTimeUnlocked: false,
        weeklyAnalysisUnlocked: false,
      },
      availablePoints: 0,
      pointsSpentOnUnlocks: 30,
      pendingTodayUnlockSpent: 30,
    };
    const progress: UnlockProgress = {
      availablePoints: 0,
      lifetimePointsEarned: 20,
      pointsSpentOnUnlocks: 30,
      nodes: [],
    };
    vi.mocked(gateways.unlock.purchase).mockResolvedValue(result);
    vi.mocked(gateways.unlock.progress).mockResolvedValue(progress);

    await purchaseUnlock("slots.4");

    expect(useUnlockStore.getState().status.maxVisibleTaskSlots).toBe(4);
    expect(useWalletStore.getState().wallet?.pointsSpentOnUnlocks).toBe(30);
    expect(useUnlockStore.getState().progress).toEqual(progress);
  });
});
