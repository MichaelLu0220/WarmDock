import type { UnlockStatus } from "../types";

/** 後端還沒回應前的預設 unlock 狀態:3 格、其他全 locked。 */
export const DEFAULT_UNLOCK_STATUS: UnlockStatus = {
  maxVisibleTaskSlots: 3,
  focusTaskFeatureUnlocked: false,
  customRefreshTimeUnlocked: false,
  weeklyAnalysisUnlocked: false,
};

export function getVisibleSlotCount(unlocks: UnlockStatus): number {
  return unlocks.maxVisibleTaskSlots;
}

export function canShowFocusTaskOption(unlocks: UnlockStatus): boolean {
  return unlocks.focusTaskFeatureUnlocked;
}

export function isRefreshTimeSettingVisible(unlocks: UnlockStatus): boolean {
  return unlocks.customRefreshTimeUnlocked;
}

export function isWeeklyAnalysisVisible(unlocks: UnlockStatus): boolean {
  return unlocks.weeklyAnalysisUnlocked;
}
