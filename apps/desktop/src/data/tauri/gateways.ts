import type {
  DevGateway,
  SessionGateway,
  SettingsGateway,
  TaskGateway,
  UnlockGateway,
} from "../ports";
import type {
  BootstrapResponseDto,
  CompleteTaskResponseDto,
  PurchaseUnlockResponseDto,
  RefreshResponseDto,
  SettingsDto,
  TaskDto,
} from "./dto";
import { call } from "./client";
import {
  bootstrapFromDto,
  completeTaskFromDto,
  purchaseFromDto,
  refreshFromDto,
  settingsFromDto,
  settingsPatchToDto,
  taskFromDto,
  unlockProgressFromDto,
} from "./mappers";
import type { UnlockProgressDto } from "./dto";

export const tauriTaskGateway: TaskGateway = {
  async listToday() {
    const dtos = await call<TaskDto[]>("get_today_tasks", { targetDate: null });
    return dtos.map(taskFromDto);
  },

  async create(title) {
    return taskFromDto(await call<TaskDto>("create_task", { title }));
  },

  async setDetail(taskId, input) {
    return taskFromDto(
      await call<TaskDto>("set_task_detail", {
        taskId,
        difficultySuggested: input.difficultySuggested,
        difficultySelected: input.difficulty,
        isFocusTask: input.isFocus ?? null,
      })
    );
  },

  async complete(taskId) {
    return completeTaskFromDto(
      await call<CompleteTaskResponseDto>("complete_task", { taskId })
    );
  },
};

export const tauriSessionGateway: SessionGateway = {
  async bootstrap() {
    return bootstrapFromDto(await call<BootstrapResponseDto>("bootstrap_app"));
  },

  async runDailyRefreshIfNeeded() {
    return refreshFromDto(
      await call<RefreshResponseDto>("run_daily_refresh_if_needed")
    );
  },
};

export const tauriUnlockGateway: UnlockGateway = {
  async progress() {
    return unlockProgressFromDto(
      await call<UnlockProgressDto>("get_unlock_progress")
    );
  },

  async purchase(nodeId) {
    return purchaseFromDto(
      await call<PurchaseUnlockResponseDto>("purchase_unlock", { nodeId })
    );
  },
};

export const tauriSettingsGateway: SettingsGateway = {
  async update(patch) {
    return settingsFromDto(
      await call<SettingsDto>("update_user_settings", {
        patch: settingsPatchToDto(patch),
      })
    );
  },

  async setTriggerPosition(y) {
    return settingsFromDto(
      await call<SettingsDto>("update_trigger_position", {
        triggerPositionY: y,
      })
    );
  },
};

export const tauriDevGateway: DevGateway = {
  async forceDailyRefresh() {
    return refreshFromDto(
      await call<RefreshResponseDto>("dev_force_daily_refresh")
    );
  },

  async resetAllData() {
    await call<string>("dev_reset_all_data");
  },
};
