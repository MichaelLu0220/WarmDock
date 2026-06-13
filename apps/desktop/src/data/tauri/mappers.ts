/**
 * DTO ↔ core 型別轉換的唯一地點。
 * snake_case/camelCase 的邊界就在這一檔,不允許散落到別處。
 */

import type {
  BootstrapSnapshot,
  CompleteTaskResult,
  DailySummary,
  Difficulty,
  PurchaseUnlockResult,
  RefreshResult,
  Settings,
  SettingsPatch,
  Task,
  UnlockNodeState,
  UnlockProgress,
  UnlockStatus,
  Wallet,
} from "@warmdock/core/types";
import type {
  BootstrapResponseDto,
  CompleteTaskResponseDto,
  DailySummaryDto,
  PurchaseUnlockResponseDto,
  RefreshResponseDto,
  SettingsDto,
  SettingsPatchDto,
  TaskDto,
  UnlockNodeStateDto,
  UnlockProgressDto,
  UnlockStatusDto,
  WalletDto,
} from "./dto";

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
    difficulty: (dto.difficulty_selected as Difficulty | null) ?? null,
    difficultySuggested: dto.difficulty_suggested,
    basePoints: dto.base_points,
    finalRewardPoints: dto.final_reward_points,
    isFocus: dto.is_focus_task,
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

export function summaryFromDto(dto: DailySummaryDto): DailySummary {
  return {
    date: dto.date,
    tasksCreated: dto.tasks_created,
    tasksCompleted: dto.tasks_completed,
    focusTasksCompleted: dto.focus_tasks_completed,
    pointsEarned: dto.points_earned,
    isAllCompleted: dto.is_all_completed,
  };
}

export function settingsFromDto(dto: SettingsDto): Settings {
  return {
    themeMode: dto.theme_mode,
    panelWidth: dto.panel_width,
    pinEnabled: dto.pin_enabled,
    refreshTime: dto.refresh_time,
    triggerPositionY: dto.trigger_position_y,
    locale: dto.locale,
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

export function bootstrapFromDto(dto: BootstrapResponseDto): BootstrapSnapshot {
  return {
    today: dto.today,
    tasks: dto.tasks.map(taskFromDto),
    wallet: walletFromDto(dto.wallet),
    settings: settingsFromDto(dto.settings),
    summary: dto.summary ? summaryFromDto(dto.summary) : null,
    unlocks: unlockStatusFromDto(dto.unlocks),
  };
}

export function completeTaskFromDto(
  dto: CompleteTaskResponseDto
): CompleteTaskResult {
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

export function purchaseFromDto(
  dto: PurchaseUnlockResponseDto
): PurchaseUnlockResult {
  return {
    nodeId: dto.node_id,
    unlocks: unlockStatusFromDto(dto.unlocks),
    availablePoints: dto.available_points,
    pointsSpentOnUnlocks: dto.points_spent_on_unlocks,
    pendingTodayUnlockSpent: dto.pending_today_unlock_spent,
  };
}

export function refreshFromDto(dto: RefreshResponseDto): RefreshResult {
  return {
    refreshApplied: dto.refresh_applied,
    previousDate: dto.previous_date,
    newDate: dto.new_date,
    wallet: walletFromDto(dto.wallet),
    previousSummary: dto.previous_summary
      ? summaryFromDto(dto.previous_summary)
      : null,
  };
}

export function settingsPatchToDto(patch: SettingsPatch): SettingsPatchDto {
  const dto: SettingsPatchDto = {};
  if (patch.themeMode !== undefined) dto.theme_mode = patch.themeMode;
  if (patch.panelWidth !== undefined) dto.panel_width = patch.panelWidth;
  if (patch.pinEnabled !== undefined) dto.pin_enabled = patch.pinEnabled;
  if (patch.refreshTime !== undefined) dto.refresh_time = patch.refreshTime;
  if (patch.locale !== undefined) dto.locale = patch.locale;
  return dto;
}
