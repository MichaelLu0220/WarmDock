import { invoke } from "@tauri-apps/api/core";
import { COMMANDS } from "./index";
import type {
  BootstrapAppResponse,
  GetTodayTasksArgs,
  GetTodayTasksResponse,
  CreateTaskArgs,
  CreateTaskResponse,
  SetTaskDetailArgs,
  SetTaskDetailResponse,
  CompleteTaskArgs,
  CompleteTaskResponse,
  GetWalletResponse,
  GetUnlockStatusResponse,
  GetUserSettingsResponse,
  UpdateUserSettingsArgs,
  UpdateUserSettingsResponse,
  UpdateTriggerPositionArgs,
  UpdateTriggerPositionResponse,
  GetTodaySummaryResponse,
  GetRecentSummariesArgs,
  GetRecentSummariesResponse,
  RunDailyRefreshIfNeededResponse,
} from "./types";

export function bootstrapApp(): Promise<BootstrapAppResponse> {
  return invoke(COMMANDS.BOOTSTRAP_APP);
}

export function getTodayTasks(
  args?: GetTodayTasksArgs
): Promise<GetTodayTasksResponse> {
  return invoke(COMMANDS.GET_TODAY_TASKS, {
    targetDate: args?.target_date ?? null,
  });
}

export function createTask(
  args: CreateTaskArgs
): Promise<CreateTaskResponse> {
  return invoke(COMMANDS.CREATE_TASK, { title: args.title });
}

export function setTaskDetail(
  args: SetTaskDetailArgs
): Promise<SetTaskDetailResponse> {
  return invoke(COMMANDS.SET_TASK_DETAIL, {
    taskId: args.task_id,
    difficultySuggested: args.difficulty_suggested,
    difficultySelected: args.difficulty_selected,
    isFocusTask: args.is_focus_task ?? null,
  });
}

export function completeTask(
  args: CompleteTaskArgs
): Promise<CompleteTaskResponse> {
  return invoke(COMMANDS.COMPLETE_TASK, { taskId: args.task_id });
}

export function getWallet(): Promise<GetWalletResponse> {
  return invoke(COMMANDS.GET_WALLET);
}

export function getUnlockStatus(): Promise<GetUnlockStatusResponse> {
  return invoke(COMMANDS.GET_UNLOCK_STATUS);
}

export function getUserSettings(): Promise<GetUserSettingsResponse> {
  return invoke(COMMANDS.GET_USER_SETTINGS);
}

export function updateUserSettings(
  args: UpdateUserSettingsArgs
): Promise<UpdateUserSettingsResponse> {
  return invoke(COMMANDS.UPDATE_USER_SETTINGS, { patch: args });
}

export function updateTriggerPosition(
  args: UpdateTriggerPositionArgs
): Promise<UpdateTriggerPositionResponse> {
  return invoke(COMMANDS.UPDATE_TRIGGER_POSITION, {
    triggerPositionY: args.trigger_position_y,
  });
}

export function getTodaySummary(): Promise<GetTodaySummaryResponse> {
  return invoke(COMMANDS.GET_TODAY_SUMMARY);
}

export function getRecentSummaries(
  args: GetRecentSummariesArgs
): Promise<GetRecentSummariesResponse> {
  return invoke(COMMANDS.GET_RECENT_SUMMARIES, { days: args.days });
}

export function runDailyRefreshIfNeeded(): Promise<RunDailyRefreshIfNeededResponse> {
  return invoke(COMMANDS.RUN_DAILY_REFRESH_IF_NEEDED);
}
