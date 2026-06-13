/**
 * core — 領域型別(camelCase)。
 * 純 TS、零依賴;這一層未來原樣升格為 packages/core。
 * wire 格式(snake_case)只存在於 data/tauri/dto.ts,由 mappers 轉換。
 */

export type TaskStatus = "draft" | "ready" | "completed";
export type DifficultyBand = "easy" | "medium" | "hard";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type ThemeMode = "light" | "dark" | "system";

export interface Task {
  id: string;
  title: string;
  targetDate: string; // "YYYY-MM-DD"
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
  status: TaskStatus;
  completedAt: string | null;
  difficulty: Difficulty | null;
  difficultySuggested: DifficultyBand | null;
  basePoints: number;
  finalRewardPoints: number;
  isFocus: boolean;
}

export interface Wallet {
  walletPoints: number;
  pendingTodayPoints: number;
  streakDays: number;
  lastCompletedDate: string | null;
  lastRolloverDate: string | null;
  bestStreakDays: number;
  lifetimePointsEarned: number;
  pointsSpentOnUnlocks: number;
  pendingTodayUnlockSpent: number;
}

export interface DailySummary {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  focusTasksCompleted: number;
  pointsEarned: number;
  isAllCompleted: boolean;
}

export interface Settings {
  themeMode: ThemeMode;
  panelWidth: number;
  pinEnabled: boolean;
  refreshTime: string; // "HH:mm"
  triggerPositionY: number; // 0.0 ~ 1.0
  locale: string;
}

export interface SettingsPatch {
  themeMode?: ThemeMode;
  panelWidth?: number;
  pinEnabled?: boolean;
  refreshTime?: string;
  locale?: string;
}

export interface UnlockStatus {
  maxVisibleTaskSlots: number;
  focusTaskFeatureUnlocked: boolean;
  customRefreshTimeUnlocked: boolean;
  weeklyAnalysisUnlocked: boolean;
}

export interface UnlockNodeState {
  nodeId: string;
  category: string;
  cost: number;
  requires: string[];
  unlocked: boolean;
  unlockedAt: string | null;
  requirementsMet: boolean;
  affordable: boolean;
}

export interface UnlockProgress {
  availablePoints: number;
  lifetimePointsEarned: number;
  pointsSpentOnUnlocks: number;
  nodes: UnlockNodeState[];
}

export interface TaskDetailInput {
  difficultySuggested: DifficultyBand | null;
  difficulty: Difficulty;
  isFocus?: boolean;
}

export interface CompleteTaskResult {
  task: Task;
  rewardEarned: number;
  bonusEarned: number;
  pendingTodayPoints: number;
  walletPoints: number;
  todaySummary: DailySummary;
  allTasksCompleted: boolean;
  streakDays: number;
  availablePointsDelta: number;
  availablePointsAfter: number;
}

export interface BootstrapSnapshot {
  today: string;
  tasks: Task[];
  wallet: Wallet;
  settings: Settings;
  summary: DailySummary | null;
  unlocks: UnlockStatus;
}

export interface PurchaseUnlockResult {
  nodeId: string;
  unlocks: UnlockStatus;
  availablePoints: number;
  pointsSpentOnUnlocks: number;
  pendingTodayUnlockSpent: number;
}

export interface RefreshResult {
  refreshApplied: boolean;
  previousDate: string | null;
  newDate: string;
  wallet: Wallet;
  previousSummary: DailySummary | null;
}
