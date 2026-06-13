/**
 * Tauri wire 格式(snake_case)。
 * 只有 mappers.ts 可以 import 這個檔;app/ui 層永遠看不到 snake_case。
 */

export type TaskStatusDto = "draft" | "ready" | "completed";

export interface TaskDto {
  id: string;
  title: string;
  target_date: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  status: TaskStatusDto;
  completed_at: string | null;
  difficulty_selected: number | null;
  difficulty_suggested: "easy" | "medium" | "hard" | null;
  base_points: number;
  final_reward_points: number;
  is_focus_task: boolean;
}

export interface WalletDto {
  wallet_points: number;
  pending_today_points: number;
  streak_days: number;
  last_completed_date: string | null;
  last_rollover_date: string | null;
  best_streak_days: number;
  lifetime_points_earned: number;
  points_spent_on_unlocks: number;
  pending_today_unlock_spent: number;
}

export interface DailySummaryDto {
  date: string;
  tasks_created: number;
  tasks_completed: number;
  focus_tasks_completed: number;
  points_earned: number;
  is_all_completed: boolean;
}

export interface SettingsDto {
  theme_mode: "light" | "dark" | "system";
  panel_width: number;
  pin_enabled: boolean;
  refresh_time: string;
  trigger_position_y: number;
  locale: string;
}

export interface UnlockStatusDto {
  max_visible_task_slots: number;
  focus_task_feature_unlocked: boolean;
  custom_refresh_time_unlocked: boolean;
  weekly_analysis_unlocked: boolean;
}

export interface UnlockNodeStateDto {
  node_id: string;
  category: string;
  cost: number;
  requires: string[];
  unlocked: boolean;
  unlocked_at: string | null;
  requirements_met: boolean;
  affordable: boolean;
}

export interface UnlockProgressDto {
  available_points: number;
  lifetime_points_earned: number;
  points_spent_on_unlocks: number;
  nodes: UnlockNodeStateDto[];
}

export interface BootstrapResponseDto {
  today: string;
  tasks: TaskDto[];
  wallet: WalletDto;
  settings: SettingsDto;
  summary: DailySummaryDto | null;
  unlocks: UnlockStatusDto;
  refresh_applied: boolean;
}

export interface CompleteTaskResponseDto {
  task: TaskDto;
  reward_earned: number;
  bonus_earned: number;
  pending_today_points: number;
  wallet_points: number;
  today_summary: DailySummaryDto;
  all_tasks_completed: boolean;
  streak_days: number;
  available_points_delta: number;
  available_points_after: number;
}

export interface PurchaseUnlockResponseDto {
  node_id: string;
  unlocks: UnlockStatusDto;
  available_points: number;
  points_spent_on_unlocks: number;
  pending_today_unlock_spent: number;
}

export interface RefreshResponseDto {
  refresh_applied: boolean;
  previous_date: string | null;
  new_date: string;
  wallet: WalletDto;
  previous_summary: DailySummaryDto | null;
}

export interface SettingsPatchDto {
  theme_mode?: "light" | "dark" | "system";
  panel_width?: number;
  pin_enabled?: boolean;
  refresh_time?: string;
  locale?: string;
}

export interface CommandErrorDto {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
