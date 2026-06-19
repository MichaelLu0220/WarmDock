/**
 * In-memory demo backend for unauthenticated visitors. Implements the same
 * UiGateways contract as the real Supabase client, so the shared <Panel/>
 * components work unchanged. Demo actions are never persisted and never touch a
 * real account.
 */
import type {
  CompleteTaskResult,
  DailySummary,
  Task,
  TaskDetailInput,
  UnlockProgress,
  UnlockStatus,
  Wallet,
} from "@warmdock/core";
import type { Profile, ProfilePatch, Snapshot } from "@warmdock/api";
import type { UiGateways } from "@warmdock/ui-web";

interface CatalogNode {
  nodeId: string;
  category: string;
  cost: number;
  requires: string[];
  effect: "none" | "max_slots" | "focus_task" | "custom_refresh_time" | "weekly_analysis";
  effectValue?: number;
}

const CATALOG: CatalogNode[] = [
  { nodeId: "root.awaken", category: "root", cost: 0, requires: [], effect: "none" },
  { nodeId: "slots.4", category: "capacity", cost: 30, requires: ["root.awaken"], effect: "max_slots", effectValue: 4 },
  { nodeId: "slots.5", category: "capacity", cost: 80, requires: ["slots.4"], effect: "max_slots", effectValue: 5 },
  { nodeId: "slots.6", category: "capacity", cost: 160, requires: ["slots.5"], effect: "max_slots", effectValue: 6 },
  { nodeId: "slots.7", category: "capacity", cost: 280, requires: ["slots.6"], effect: "max_slots", effectValue: 7 },
  { nodeId: "focus.basic", category: "focus", cost: 50, requires: ["root.awaken"], effect: "focus_task" },
  { nodeId: "time.custom_refresh", category: "time", cost: 20, requires: ["root.awaken"], effect: "custom_refresh_time" },
  { nodeId: "analysis.weekly", category: "analysis", cost: 120, requires: ["root.awaken"], effect: "weekly_analysis" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** demo 的初始種子(gateway 內部狀態)。可被 buildDemoScene 換成各導覽步驟的場景。 */
export interface DemoSeed {
  tasks: Task[];
  wallet: Wallet;
  owned: string[];
}

function makeWallet(pendingTodayPoints: number): Wallet {
  return {
    walletPoints: 40,
    pendingTodayPoints,
    streakDays: 6,
    lastCompletedDate: todayISO(),
    lastRolloverDate: null,
    bestStreakDays: 6,
    lifetimePointsEarned: 40 + pendingTodayPoints,
    pointsSpentOnUnlocks: 0,
    pendingTodayUnlockSpent: 0,
  };
}

/** 預設場景(導覽第 1 步):1 件已完成 + 1 件預填 + 1 個空格(maxSlots=3)。 */
export function defaultDemoSeed(): DemoSeed {
  const today = todayISO();
  const now = new Date().toISOString();
  return {
    tasks: [
      {
        id: "demo-1", title: "Send the project proposal", targetDate: today, createdAt: now, updatedAt: now,
        sortOrder: 0, status: "completed", completedAt: now, difficulty: 4, difficultySuggested: "hard",
        basePoints: 4, finalRewardPoints: 4, isFocus: false,
      },
      {
        id: "demo-2", title: "Practice piano, 20 min", targetDate: today, createdAt: now, updatedAt: now,
        sortOrder: 1, status: "ready", completedAt: null, difficulty: 3, difficultySuggested: "medium",
        basePoints: 3, finalRewardPoints: 3, isFocus: false,
      },
    ],
    wallet: makeWallet(4),
    owned: [],
  };
}

export function createDemoGateways(initial?: DemoSeed): UiGateways {
  const today = todayISO();
  const now = new Date().toISOString();

  const seed = initial ?? defaultDemoSeed();
  const tasks: Task[] = seed.tasks.map((tk) => ({ ...tk }));
  const wallet: Wallet = { ...seed.wallet };
  const owned = new Set<string>(seed.owned);
  const requestIds = new Map<string, string>();

  const profile: Profile = {
    userId: "demo", reminderIntensity: "normal", aiImprovementOptOut: false, locale: "en",
    themeMode: "system", customRefreshTime: null, ageConfirmed13: true, status: "active",
    deletionDueAt: null, createdAt: now,
  };

  function available(): number {
    return wallet.walletPoints + wallet.pendingTodayPoints - wallet.pendingTodayUnlockSpent;
  }

  function unlockStatus(): UnlockStatus {
    let maxSlots = 3;
    let focus = false, custom = false, weekly = false;
    for (const n of CATALOG) {
      if (!owned.has(n.nodeId)) continue;
      if (n.effect === "max_slots" && n.effectValue) maxSlots = Math.max(maxSlots, n.effectValue);
      if (n.effect === "focus_task") focus = true;
      if (n.effect === "custom_refresh_time") custom = true;
      if (n.effect === "weekly_analysis") weekly = true;
    }
    return {
      maxVisibleTaskSlots: maxSlots,
      focusTaskFeatureUnlocked: focus,
      customRefreshTimeUnlocked: custom,
      weeklyAnalysisUnlocked: weekly,
    };
  }

  function summary(): DailySummary {
    const completed = tasks.filter((t) => t.status === "completed");
    return {
      date: today,
      tasksCreated: tasks.filter((t) => t.status !== "draft").length,
      tasksCompleted: completed.length,
      focusTasksCompleted: completed.filter((t) => t.isFocus).length,
      pointsEarned: completed.reduce((s, t) => s + t.finalRewardPoints, 0),
      isAllCompleted: completed.length === unlockStatus().maxVisibleTaskSlots,
    };
  }

  return {
    task: {
      async listToday() {
        return [...tasks];
      },
      async create(title, clientRequestId) {
        const existingId = requestIds.get(clientRequestId);
        if (existingId) return { ...tasks.find((t) => t.id === existingId)! };
        const id = `demo-${tasks.length + 1}-${Date.now()}`;
        const task: Task = {
          id, title, targetDate: today, createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(), sortOrder: tasks.length, status: "draft",
          completedAt: null, difficulty: null, difficultySuggested: null,
          basePoints: 0, finalRewardPoints: 0, isFocus: false,
        };
        tasks.push(task);
        requestIds.set(clientRequestId, id);
        return { ...task };
      },
      async updateTitle(taskId, title) {
        const task = tasks.find((t) => t.id === taskId)!;
        if (task.status === "draft") {
          task.title = title;
          task.updatedAt = new Date().toISOString();
        }
        return { ...task };
      },
      async discard(taskId) {
        const i = tasks.findIndex((t) => t.id === taskId);
        if (i >= 0 && tasks[i].status === "draft") tasks.splice(i, 1);
      },
      async setDetail(taskId, input: TaskDetailInput) {
        const task = tasks.find((t) => t.id === taskId)!;
        task.difficulty = input.difficulty;
        task.difficultySuggested = input.difficultySuggested;
        task.isFocus = input.isFocus ?? false;
        task.basePoints = input.difficulty;
        task.finalRewardPoints = input.difficulty + (task.isFocus ? 1 : 0);
        task.status = "ready";
        task.updatedAt = new Date().toISOString();
        return { ...task };
      },
      async complete(taskId): Promise<CompleteTaskResult> {
        const task = tasks.find((t) => t.id === taskId)!;
        task.status = "completed";
        task.completedAt = new Date().toISOString();
        const reward = task.finalRewardPoints;
        wallet.pendingTodayPoints += reward;
        wallet.lifetimePointsEarned += reward;
        const s = summary();
        return {
          task: { ...task },
          rewardEarned: task.basePoints,
          bonusEarned: reward - task.basePoints,
          pendingTodayPoints: wallet.pendingTodayPoints,
          walletPoints: wallet.walletPoints,
          todaySummary: s,
          allTasksCompleted: s.isAllCompleted,
          streakDays: wallet.streakDays,
          availablePointsDelta: reward,
          availablePointsAfter: available(),
        };
      },
    },
    session: {
      async bootstrap(): Promise<Snapshot> {
        return {
          today,
          settled: false,
          tasks: [...tasks],
          wallet: { ...wallet },
          profile: { ...profile },
          summary: summary(),
          unlocks: unlockStatus(),
        };
      },
    },
    unlock: {
      async progress(): Promise<UnlockProgress> {
        const avail = available();
        return {
          availablePoints: avail,
          lifetimePointsEarned: wallet.lifetimePointsEarned,
          pointsSpentOnUnlocks: wallet.pointsSpentOnUnlocks,
          nodes: CATALOG.map((n) => {
            const reqMet = n.requires.every((r) => owned.has(r));
            return {
              nodeId: n.nodeId, category: n.category, cost: n.cost, requires: n.requires,
              unlocked: owned.has(n.nodeId), unlockedAt: owned.has(n.nodeId) ? now : null,
              requirementsMet: reqMet, affordable: !owned.has(n.nodeId) && reqMet && avail >= n.cost,
            };
          }),
        };
      },
      async purchase(nodeId) {
        const node = CATALOG.find((n) => n.nodeId === nodeId)!;
        owned.add(nodeId);
        wallet.pointsSpentOnUnlocks += node.cost;
        wallet.pendingTodayUnlockSpent += node.cost;
        return {
          nodeId,
          unlocks: unlockStatus(),
          availablePoints: available(),
          pointsSpentOnUnlocks: wallet.pointsSpentOnUnlocks,
          pendingTodayUnlockSpent: wallet.pendingTodayUnlockSpent,
        };
      },
    },
    settings: {
      async updatePreferences(patch: ProfilePatch) {
        if (patch.reminderIntensity !== undefined) profile.reminderIntensity = patch.reminderIntensity;
        if (patch.aiImprovementOptOut !== undefined) profile.aiImprovementOptOut = patch.aiImprovementOptOut;
        if (patch.locale !== undefined) profile.locale = patch.locale;
        if (patch.themeMode !== undefined) profile.themeMode = patch.themeMode;
        return { ...profile };
      },
    },
    // no realtime in demo
  };
}

/* ============================================================
   導覽步驟場景 —— 左側 GUIDED TOUR 翻到某步,右側 demo 直接跳到該步
   的狀態(DemoTour.jumpTo 用)。每個場景 = gateway 種子 + 需要額外
   打開的 UI(設定 modal / 完成 flash)。
   ============================================================ */

export type DemoStepId =
  | "add"
  | "weight"
  | "finish1"
  | "tap"
  | "finish2"
  | "summary"
  | "final";

export interface DemoScene {
  seed: DemoSeed;
  /** 跳場後要額外打開的 UI */
  ui: {
    /** 開啟此任務的設定 modal(weight 步) */
    modalTaskId?: string;
    /** 顯示單任務完成 flash(tap 步) */
    flash?: { title: string; points: number };
  };
}

function sceneTask(
  id: string,
  title: string,
  sortOrder: number,
  opts: Partial<Task>
): Task {
  const today = todayISO();
  const now = new Date().toISOString();
  return {
    id, title, targetDate: today, createdAt: now, updatedAt: now, sortOrder,
    status: "ready", completedAt: null, difficulty: null, difficultySuggested: null,
    basePoints: 0, finalRewardPoints: 0, isFocus: false,
    ...opts,
  };
}

const SENT_DONE = (): Task =>
  sceneTask("demo-1", "Send the project proposal", 0, {
    status: "completed", completedAt: new Date().toISOString(),
    difficulty: 4, difficultySuggested: "hard", basePoints: 4, finalRewardPoints: 4,
  });
const PIANO_READY = (): Task =>
  sceneTask("demo-2", "Practice piano, 20 min", 1, {
    status: "ready", difficulty: 3, difficultySuggested: "medium", basePoints: 3, finalRewardPoints: 3,
  });
const PIANO_DONE = (): Task => ({ ...PIANO_READY(), status: "completed", completedAt: new Date().toISOString() });
const PLAN_READY = (): Task =>
  sceneTask("demo-3", "Plan tomorrow's day", 2, {
    status: "ready", difficulty: 2, difficultySuggested: "easy", basePoints: 2, finalRewardPoints: 2,
  });
const PLAN_DONE = (): Task => ({ ...PLAN_READY(), status: "completed", completedAt: new Date().toISOString() });
const PLAN_DRAFT = (): Task => sceneTask("demo-3", "Plan tomorrow's day", 2, { status: "draft" });

function seedOf(tasks: Task[]): DemoSeed {
  const pending = tasks
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.finalRewardPoints, 0);
  return { tasks, wallet: makeWallet(pending), owned: [] };
}

/** 取得某導覽步驟對應的場景(gateway 種子 + UI 旗標)。 */
export function buildDemoScene(step: DemoStepId): DemoScene {
  switch (step) {
    case "weight":
      return { seed: seedOf([SENT_DONE(), PIANO_READY(), PLAN_DRAFT()]), ui: { modalTaskId: "demo-3" } };
    case "tap":
      return {
        seed: seedOf([SENT_DONE(), PIANO_DONE()]),
        ui: { flash: { title: "Practice piano, 20 min", points: 3 } },
      };
    case "finish2":
      return { seed: seedOf([SENT_DONE(), PIANO_DONE(), PLAN_READY()]), ui: {} };
    case "summary":
    case "final":
      return { seed: seedOf([SENT_DONE(), PIANO_DONE(), PLAN_DONE()]), ui: {} };
    case "add":
    case "finish1":
    default:
      return { seed: seedOf([SENT_DONE(), PIANO_READY()]), ui: {} };
  }
}
