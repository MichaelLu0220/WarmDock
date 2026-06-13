export type AutoHideAction = "none" | "panel" | "unlock";

type AutoHideState = {
  isPanelOpen: boolean;
  isWindowTransitioning: boolean;
  isTaskDetailOpen: boolean;
  isUnlockTreeOpen: boolean;
  isUnlockMaximized: boolean;
  isSettingsOpen: boolean;
  isComposingTask: boolean;
  pinEnabled: boolean;
};

export function getAutoHideAction(state: AutoHideState): AutoHideAction {
  if (!state.isPanelOpen || state.isWindowTransitioning || state.pinEnabled) {
    return "none";
  }

  if (state.isUnlockTreeOpen) {
    return state.isUnlockMaximized ? "none" : "unlock";
  }

  if (state.isTaskDetailOpen || state.isSettingsOpen || state.isComposingTask) {
    return "none";
  }

  return "panel";
}
