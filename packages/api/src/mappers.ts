/**
 * DTO -> domain conversion (snake_case -> camelCase). The single boundary for
 * the cloud wire format, mirroring the desktop data/tauri/mappers.ts pattern.
 */
import type {
  CompleteTaskResult,
  DailySummary,
  Difficulty,
  PurchaseUnlockResult,
  Task,
  UnlockNodeState,
  UnlockProgress,
  UnlockStatus,
  Wallet,
} from "@warmdock/core";
import type {
  CompleteTaskDto,
  Profile,
  ProfileDto,
  PurchaseDto,
  Snapshot,
  SnapshotDto,
  SummaryDto,
  TaskDto,
  UnlockNodeStateDto,
  UnlockProgressDto,
  UnlockStatusDto,
  WalletDto,
} from "./types";

export function taskFromDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    targetDate: dto.target_date,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    sortOrder: dto.sort_order,
    status: dto.status,
    completedAt: dto.completed_at,
    difficulty: (dto.difficulty as Difficulty | null) ?? null,
    difficultySuggested: dto.difficulty_suggested,
    basePoints: dto.base_points,
    finalRewardPoints: dto.final_reward_points,
    isFocus: dto.is_focus,
  };
}

export function walletFromDto(dto: WalletDto): Wallet {
  return {
    walletPoints: dto.wallet_points,
    pendingTodayPoints: dto.pending_today_points,
    streakDays: dto.streak_days,
    lastCompletedDate: dto.last_completed_date,
    lastRolloverDate: dto.last_rollover_date,
    bestStreakDays: dto.best_streak_days,
    lifetimePointsEarned: dto.lifetime_points_earned,
    pointsSpentOnUnlocks: dto.points_spent_on_unlocks,
    pendingTodayUnlockSpent: dto.pending_today_unlock_spent,
  };
}

export function summaryFromDto(dto: SummaryDto): DailySummary {
  return {
    date: dto.date,
    tasksCreated: dto.tasks_created,
    tasksCompleted: dto.tasks_completed,
    focusTasksCompleted: dto.focus_tasks_completed,
    pointsEarned: dto.points_earned,
    isAllCompleted: dto.is_all_completed,
  };
}

export function unlockStatusFromDto(dto: UnlockStatusDto): UnlockStatus {
  return {
    maxVisibleTaskSlots: dto.max_visible_task_slots,
    focusTaskFeatureUnlocked: dto.focus_task_feature_unlocked,
    customRefreshTimeUnlocked: dto.custom_refresh_time_unlocked,
    weeklyAnalysisUnlocked: dto.weekly_analysis_unlocked,
  };
}

export function unlockNodeFromDto(dto: UnlockNodeStateDto): UnlockNodeState {
  return {
    nodeId: dto.node_id,
    category: dto.category,
    cost: dto.cost,
    requires: dto.requires,
    unlocked: dto.unlocked,
    unlockedAt: dto.unlocked_at,
    requirementsMet: dto.requirements_met,
    affordable: dto.affordable,
  };
}

export function unlockProgressFromDto(dto: UnlockProgressDto): UnlockProgress {
  return {
    availablePoints: dto.available_points,
    lifetimePointsEarned: dto.lifetime_points_earned,
    pointsSpentOnUnlocks: dto.points_spent_on_unlocks,
    nodes: dto.nodes.map(unlockNodeFromDto),
  };
}

export function profileFromDto(dto: ProfileDto): Profile {
  return {
    userId: dto.user_id,
    reminderIntensity: dto.reminder_intensity,
    aiImprovementOptOut: dto.ai_improvement_opt_out,
    locale: dto.locale,
    themeMode: dto.theme_mode,
    customRefreshTime: dto.custom_refresh_time,
    ageConfirmed13: dto.age_confirmed_13,
    status: dto.status,
    deletionDueAt: dto.deletion_due_at,
    createdAt: dto.created_at,
  };
}

export function completeFromDto(dto: CompleteTaskDto): CompleteTaskResult {
  return {
    task: taskFromDto(dto.task),
    rewardEarned: dto.reward_earned,
    bonusEarned: dto.bonus_earned,
    pendingTodayPoints: dto.pending_today_points,
    walletPoints: dto.wallet_points,
    todaySummary: summaryFromDto(dto.today_summary),
    allTasksCompleted: dto.all_tasks_completed,
    streakDays: dto.streak_days,
    availablePointsDelta: dto.available_points_delta,
    availablePointsAfter: dto.available_points_after,
  };
}

export function purchaseFromDto(dto: PurchaseDto): PurchaseUnlockResult {
  return {
    nodeId: dto.node_id,
    unlocks: unlockStatusFromDto(dto.unlocks),
    availablePoints: dto.available_points,
    pointsSpentOnUnlocks: dto.points_spent_on_unlocks,
    pendingTodayUnlockSpent: dto.pending_today_unlock_spent,
  };
}

export function snapshotFromDto(dto: SnapshotDto): Snapshot {
  return {
    today: dto.today,
    settled: dto.settled,
    tasks: dto.tasks.map(taskFromDto),
    wallet: walletFromDto(dto.wallet),
    profile: profileFromDto(dto.settings),
    summary: dto.summary ? summaryFromDto(dto.summary) : null,
    unlocks: unlockStatusFromDto(dto.unlocks),
  };
}
