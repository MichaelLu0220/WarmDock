import type { Task } from "../models/Task";
import type { UserSettings } from "../models/UserSettings";
import type { UserWallet } from "../models/UserWallet";
import type { DailySummary } from "../models/DailySummary";

/**
 * Shared
 */
export type DifficultyBand = "easy" | "medium" | "hard";

export type UnlockStatus = {
  max_visible_task_slots: number;
  focus_task_feature_unlocked: boolean;
  custom_refresh_time_unlocked: boolean;
  weekly_analysis_unlocked: boolean;
};

/**
 * bootstrap_app
 */
export type BootstrapAppResponse = {
  today: string;
  tasks: Task[];
  wallet: UserWallet;
  settings: UserSettings;
  summary: DailySummary | null;
  unlocks: UnlockStatus;
  refresh_applied: boolean;
};

/**
 * get_today_tasks
 */
export type GetTodayTasksArgs = {
  target_date?: string;
};

export type GetTodayTasksResponse = Task[];

/**
 * create_task
 */
export type CreateTaskArgs = {
  title: string;
};

export type CreateTaskResponse = Task;

/**
 * set_task_detail
 */
export type SetTaskDetailArgs = {
  task_id: string;
  difficulty_suggested: DifficultyBand | null;
  difficulty_selected: 1 | 2 | 3 | 4 | 5;
  is_focus_task?: boolean;
};

export type SetTaskDetailResponse = Task;

/**
 * complete_task
 */
export type CompleteTaskArgs = {
  task_id: string;
};

export type CompleteTaskResponse = {
  task: Task;
  reward_earned: number;
  bonus_earned: number;
  pending_today_points: number;
  wallet_points: number;
  today_summary: DailySummary;
  all_tasks_completed: boolean;
  streak_days: number;
  // Round A.0 新增:給前端做 +N 可花點動畫用
  available_points_delta: number;
  available_points_after: number;
};

/**
 * get_wallet
 */
export type GetWalletResponse = UserWallet;

/**
 * get_unlock_status
 */
export type GetUnlockStatusResponse = UnlockStatus;

/**
 * get_unlock_progress (Round A.0 新增)
 */
export type UnlockNodeState = {
  node_id: string;
  category: string;
  cost: number;
  requires: string[];
  unlocked: boolean;
  unlocked_at: string | null;
  requirements_met: boolean;
  affordable: boolean;
};

export type UnlockProgressResponse = {
  available_points: number;
  lifetime_points_earned: number;
  points_spent_on_unlocks: number;
  nodes: UnlockNodeState[];
};

/**
 * purchase_unlock (Round A.0 新增)
 */
export type PurchaseUnlockArgs = {
  node_id: string;
};

export type PurchaseUnlockResponse = {
  node_id: string;
  unlocks: UnlockStatus;
  available_points: number;
  points_spent_on_unlocks: number;
  pending_today_unlock_spent: number;
};

/**
 * get_user_settings
 */
export type GetUserSettingsResponse = UserSettings;

/**
 * update_user_settings
 */
export type UpdateUserSettingsArgs = {
  theme_mode?: "light" | "dark" | "system";
  panel_width?: number;
  pin_enabled?: boolean;
  refresh_time?: string;
};

export type UpdateUserSettingsResponse = UserSettings;

/**
 * update_trigger_position
 */
export type UpdateTriggerPositionArgs = {
  trigger_position_y: number;
};

export type UpdateTriggerPositionResponse = UserSettings;

/**
 * get_today_summary
 */
export type GetTodaySummaryResponse = DailySummary | null;

/**
 * get_recent_summaries
 */
export type GetRecentSummariesArgs = {
  days: number;
};

export type GetRecentSummariesResponse = DailySummary[];

/**
 * run_daily_refresh_if_needed
 */
export type RunDailyRefreshIfNeededResponse = {
  refresh_applied: boolean;
  previous_date: string | null;
  new_date: string;
  wallet: UserWallet;
  previous_summary: DailySummary | null;
};