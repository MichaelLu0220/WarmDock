import type { UnlockStatus } from "../commands/types";

/**
 * 預設的 unlock 狀態(後端還沒回應時使用)。
 * MVP 固定 3 格、其他功能全部 locked。
 */
export const DEFAULT_UNLOCK_STATUS: UnlockStatus = {
  max_visible_task_slots: 3,
  focus_task_feature_unlocked: false,
  custom_refresh_time_unlocked: false,
  weekly_analysis_unlocked: false,
};

/**
 * 取得目前可見的 task slot 數量。
 */
export function getVisibleSlotCount(unlocks: UnlockStatus): number {
  return unlocks.max_visible_task_slots;
}

/**
 * 是否顯示「標記為 focus task」選項(TaskDetailModal 用)。
 */
export function canShowFocusTaskOption(unlocks: UnlockStatus): boolean {
  return unlocks.focus_task_feature_unlocked;
}

/**
 * 是否顯示「自訂每日重置時間」設定(SettingsPanel 用)。
 */
export function isRefreshTimeSettingVisible(unlocks: UnlockStatus): boolean {
  return unlocks.custom_refresh_time_unlocked;
}

/**
 * 是否顯示週分析入口。
 */
export function isWeeklyAnalysisVisible(unlocks: UnlockStatus): boolean {
  return unlocks.weekly_analysis_unlocked;
}