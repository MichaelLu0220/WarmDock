import { describe, expect, it } from "vitest";
import type { CompleteTaskResponseDto, TaskDto, WalletDto } from "./dto";
import {
  completeTaskFromDto,
  settingsPatchToDto,
  taskFromDto,
  walletFromDto,
} from "./mappers";

const taskDto: TaskDto = {
  id: "t1",
  title: "寫測試",
  target_date: "2026-06-12",
  created_at: "c",
  updated_at: "u",
  sort_order: 2,
  status: "ready",
  completed_at: null,
  difficulty_selected: 3,
  difficulty_suggested: "medium",
  base_points: 3,
  final_reward_points: 4,
  is_focus_task: true,
};

const walletDto: WalletDto = {
  wallet_points: 10,
  pending_today_points: 4,
  streak_days: 2,
  last_completed_date: "2026-06-12",
  last_rollover_date: "2026-06-12",
  best_streak_days: 5,
  lifetime_points_earned: 50,
  points_spent_on_unlocks: 30,
  pending_today_unlock_spent: 0,
};

describe("mappers", () => {
  it("task dto → core", () => {
    const task = taskFromDto(taskDto);
    expect(task).toEqual({
      id: "t1",
      title: "寫測試",
      targetDate: "2026-06-12",
      createdAt: "c",
      updatedAt: "u",
      sortOrder: 2,
      status: "ready",
      completedAt: null,
      difficulty: 3,
      difficultySuggested: "medium",
      basePoints: 3,
      finalRewardPoints: 4,
      isFocus: true,
    });
  });

  it("wallet dto → core", () => {
    const wallet = walletFromDto(walletDto);
    expect(wallet.walletPoints).toBe(10);
    expect(wallet.pendingTodayUnlockSpent).toBe(0);
    expect(wallet.lastRolloverDate).toBe("2026-06-12");
  });

  it("complete response dto → core", () => {
    const dto: CompleteTaskResponseDto = {
      task: { ...taskDto, status: "completed", completed_at: "now" },
      reward_earned: 3,
      bonus_earned: 1,
      pending_today_points: 4,
      wallet_points: 10,
      today_summary: {
        date: "2026-06-12",
        tasks_created: 1,
        tasks_completed: 1,
        focus_tasks_completed: 1,
        points_earned: 4,
        is_all_completed: false,
      },
      all_tasks_completed: false,
      streak_days: 2,
      available_points_delta: 4,
      available_points_after: 14,
    };
    const result = completeTaskFromDto(dto);
    expect(result.task.status).toBe("completed");
    expect(result.todaySummary.tasksCompleted).toBe(1);
    expect(result.availablePointsAfter).toBe(14);
  });

  it("settings patch core → dto 只帶有送的欄位", () => {
    expect(settingsPatchToDto({ themeMode: "dark" })).toEqual({
      theme_mode: "dark",
    });
    expect(settingsPatchToDto({ pinEnabled: false, panelWidth: 360 })).toEqual({
      pin_enabled: false,
      panel_width: 360,
    });
    expect(settingsPatchToDto({})).toEqual({});
  });
});
