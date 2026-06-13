import { describe, expect, it } from "vitest";
import { AppError } from "@warmdock/core";
import {
  completeFromDto,
  snapshotFromDto,
  taskFromDto,
  unlockProgressFromDto,
  walletFromDto,
} from "./mappers";
import { mapPostgrestError, rpcResult } from "./errors";
import type { CompleteTaskDto, SnapshotDto, TaskDto, WalletDto } from "./types";

const taskDto: TaskDto = {
  id: "t1",
  title: "write tests",
  target_date: "2026-06-14",
  created_at: "2026-06-14T00:00:00Z",
  updated_at: "2026-06-14T00:01:00Z",
  sort_order: 0,
  status: "ready",
  completed_at: null,
  difficulty: 3,
  difficulty_suggested: "medium",
  base_points: 3,
  final_reward_points: 4,
  is_focus: true,
};

describe("taskFromDto", () => {
  it("maps snake_case wire to camelCase domain", () => {
    const t = taskFromDto(taskDto);
    expect(t).toMatchObject({
      id: "t1",
      targetDate: "2026-06-14",
      sortOrder: 0,
      difficulty: 3,
      difficultySuggested: "medium",
      basePoints: 3,
      finalRewardPoints: 4,
      isFocus: true,
    });
  });

  it("keeps a null difficulty null", () => {
    expect(taskFromDto({ ...taskDto, difficulty: null }).difficulty).toBeNull();
  });
});

describe("walletFromDto", () => {
  it("maps every wallet field", () => {
    const dto: WalletDto = {
      user_id: "u1",
      wallet_points: 10,
      pending_today_points: 4,
      pending_today_unlock_spent: 1,
      streak_days: 2,
      best_streak_days: 5,
      last_completed_date: "2026-06-14",
      last_rollover_date: null,
      lifetime_points_earned: 100,
      points_spent_on_unlocks: 30,
    };
    expect(walletFromDto(dto)).toEqual({
      walletPoints: 10,
      pendingTodayPoints: 4,
      pendingTodayUnlockSpent: 1,
      streakDays: 2,
      bestStreakDays: 5,
      lastCompletedDate: "2026-06-14",
      lastRolloverDate: null,
      lifetimePointsEarned: 100,
      pointsSpentOnUnlocks: 30,
    });
  });
});

describe("completeFromDto", () => {
  it("maps the completion result including nested task and summary", () => {
    const dto: CompleteTaskDto = {
      task: { ...taskDto, status: "completed", completed_at: "2026-06-14T01:00:00Z" },
      reward_earned: 3,
      bonus_earned: 1,
      pending_today_points: 4,
      wallet_points: 0,
      today_summary: {
        date: "2026-06-14",
        tasks_created: 1,
        tasks_completed: 1,
        focus_tasks_completed: 1,
        points_earned: 4,
        is_all_completed: false,
      },
      all_tasks_completed: false,
      streak_days: 0,
      available_points_delta: 4,
      available_points_after: 4,
    };
    const r = completeFromDto(dto);
    expect(r.task.status).toBe("completed");
    expect(r.rewardEarned).toBe(3);
    expect(r.bonusEarned).toBe(1);
    expect(r.todaySummary.focusTasksCompleted).toBe(1);
    expect(r.availablePointsAfter).toBe(4);
  });
});

describe("unlockProgressFromDto", () => {
  it("maps nodes", () => {
    const p = unlockProgressFromDto({
      available_points: 50,
      lifetime_points_earned: 100,
      points_spent_on_unlocks: 30,
      nodes: [
        {
          node_id: "slots.4",
          category: "capacity",
          cost: 30,
          requires: ["root.awaken"],
          unlocked: false,
          unlocked_at: null,
          requirements_met: true,
          affordable: true,
        },
      ],
    });
    expect(p.availablePoints).toBe(50);
    expect(p.nodes[0]).toMatchObject({ nodeId: "slots.4", requirementsMet: true, affordable: true });
  });
});

describe("profileFromDto / snapshotFromDto", () => {
  it("maps the profile under snapshot.profile", () => {
    const snap: SnapshotDto = {
      today: "2026-06-14",
      tasks: [taskDto],
      wallet: {
        user_id: "u1",
        wallet_points: 0,
        pending_today_points: 4,
        pending_today_unlock_spent: 0,
        streak_days: 0,
        best_streak_days: 0,
        last_completed_date: null,
        last_rollover_date: null,
        lifetime_points_earned: 4,
        points_spent_on_unlocks: 0,
      },
      settings: {
        user_id: "u1",
        reminder_intensity: "normal",
        ai_improvement_opt_out: false,
        locale: "en",
        theme_mode: "system",
        custom_refresh_time: null,
        age_confirmed_13: true,
        status: "active",
        deletion_due_at: null,
        created_at: "2026-06-14T00:00:00Z",
      },
      summary: null,
      unlocks: {
        max_visible_task_slots: 3,
        focus_task_feature_unlocked: false,
        custom_refresh_time_unlocked: false,
        weekly_analysis_unlocked: false,
      },
    };
    const s = snapshotFromDto(snap);
    expect(s.tasks).toHaveLength(1);
    expect(s.profile.reminderIntensity).toBe("normal");
    expect(s.profile.ageConfirmed13).toBe(true);
    expect(s.summary).toBeNull();
    expect(s.unlocks.maxVisibleTaskSlots).toBe(3);
  });
});

describe("error mapping", () => {
  it("maps a P0001 app code to the matching AppError", () => {
    const err = mapPostgrestError({ code: "P0001", message: "TASK_ALREADY_COMPLETED" });
    expect(err).toBeInstanceOf(AppError);
    expect(err?.code).toBe("TASK_ALREADY_COMPLETED");
  });

  it("maps a P0001 cloud-only code (CYCLE_SETTLED)", () => {
    expect(mapPostgrestError({ code: "P0001", message: "CYCLE_SETTLED" })?.code).toBe("CYCLE_SETTLED");
  });

  it("maps an unknown database error to DB_ERROR", () => {
    expect(mapPostgrestError({ code: "23505", message: "duplicate key" })?.code).toBe("DB_ERROR");
  });

  it("returns null when there is no error", () => {
    expect(mapPostgrestError(null)).toBeNull();
  });

  it("rpcResult throws the mapped error and unwraps success", () => {
    expect(() => rpcResult(null, { code: "P0001", message: "INSUFFICIENT_POINTS" })).toThrow(AppError);
    expect(rpcResult({ ok: 1 }, null)).toEqual({ ok: 1 });
  });
});
