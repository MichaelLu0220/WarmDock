/**
 * Cloud DTOs (snake_case JSON returned by Supabase RPCs) and the camelCase
 * domain shapes specific to the cloud client. Shared domain types come from
 * @warmdock/core; only cloud-specific shapes (Profile, Snapshot, AiAnalysis)
 * are defined here.
 */
import type {
  Task,
  Wallet,
  DailySummary,
  UnlockStatus,
  Difficulty,
  DifficultyBand,
  ThemeMode,
} from "@warmdock/core";

export type {
  Task,
  Wallet,
  DailySummary,
  UnlockStatus,
  UnlockNodeState,
  UnlockProgress,
  CompleteTaskResult,
  PurchaseUnlockResult,
  TaskDetailInput,
} from "@warmdock/core";

// ---------------------------------------------------------------------------
// raw RPC DTOs
// ---------------------------------------------------------------------------
export interface TaskDto {
  id: string;
  title: string;
  target_date: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  status: Task["status"];
  completed_at: string | null;
  difficulty: number | null;
  difficulty_suggested: DifficultyBand | null;
  base_points: number;
  final_reward_points: number;
  is_focus: boolean;
}

export interface WalletDto {
  user_id: string;
  wallet_points: number;
  pending_today_points: number;
  pending_today_unlock_spent: number;
  streak_days: number;
  best_streak_days: number;
  last_completed_date: string | null;
  last_rollover_date: string | null;
  lifetime_points_earned: number;
  points_spent_on_unlocks: number;
}

export interface SummaryDto {
  date: string;
  tasks_created: number;
  tasks_completed: number;
  focus_tasks_completed: number;
  points_earned: number;
  is_all_completed: boolean;
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

export interface CompleteTaskDto {
  task: TaskDto;
  reward_earned: number;
  bonus_earned: number;
  pending_today_points: number;
  wallet_points: number;
  today_summary: SummaryDto;
  all_tasks_completed: boolean;
  streak_days: number;
  available_points_delta: number;
  available_points_after: number;
}

export interface PurchaseDto {
  node_id: string;
  unlocks: UnlockStatusDto;
  available_points: number;
  points_spent_on_unlocks: number;
  pending_today_unlock_spent: number;
}

export interface ProfileDto {
  user_id: string;
  reminder_intensity: ReminderIntensity;
  ai_improvement_opt_out: boolean;
  locale: string;
  theme_mode: ThemeMode;
  custom_refresh_time: string | null;
  age_confirmed_13: boolean;
  status: AccountStatus;
  deletion_due_at: string | null;
  created_at: string;
}

export interface SnapshotDto {
  today: string | null;
  tasks: TaskDto[];
  wallet: WalletDto;
  settings: ProfileDto;
  summary: SummaryDto | null;
  unlocks: UnlockStatusDto;
}

// ---------------------------------------------------------------------------
// cloud-specific domain shapes
// ---------------------------------------------------------------------------
export type ReminderIntensity = "off" | "low" | "normal" | "high";
export type AccountStatus = "active" | "pending_deletion";

export interface Profile {
  userId: string;
  reminderIntensity: ReminderIntensity;
  aiImprovementOptOut: boolean;
  locale: string;
  themeMode: ThemeMode;
  customRefreshTime: string | null;
  ageConfirmed13: boolean;
  status: AccountStatus;
  deletionDueAt: string | null;
  createdAt: string;
}

export interface ProfilePatch {
  reminderIntensity?: ReminderIntensity;
  aiImprovementOptOut?: boolean;
  locale?: string;
  themeMode?: ThemeMode;
}

export interface Snapshot {
  today: string | null;
  tasks: Task[];
  wallet: Wallet;
  profile: Profile;
  summary: DailySummary | null;
  unlocks: UnlockStatus;
}

export interface AiAnalysis {
  originalText: string;
  suggestedCorrection: string | null;
  suggestedBand: DifficultyBand;
  suggestedScore: Difficulty;
  reason: string;
  available: boolean;
}
