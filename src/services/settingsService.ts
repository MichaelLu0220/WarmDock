import { updateUserSettings, updateTriggerPosition } from "../commands/invoke";
import type { UserSettings } from "../models/UserSettings";
import type {
  UpdateUserSettingsArgs,
  UpdateTriggerPositionArgs,
} from "../commands/types";

export async function saveUserSettings(
  args: UpdateUserSettingsArgs
): Promise<UserSettings> {
  return updateUserSettings(args);
}

export async function saveTriggerPosition(
  args: UpdateTriggerPositionArgs
): Promise<UserSettings> {
  return updateTriggerPosition(args);
}