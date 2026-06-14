/**
 * Supabase implementations of the data gateways. Each authoritative mutation
 * calls a SECURITY DEFINER RPC; reads use the INVOKER read RPCs; preferences use
 * an RLS-protected direct UPDATE.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SessionGateway,
  SettingsGateway,
  TaskGateway,
  UnlockGateway,
} from "./ports";
import type {
  CompleteTaskDto,
  ProfileDto,
  ProfilePatch,
  PurchaseDto,
  SnapshotDto,
  TaskDto,
  UnlockProgressDto,
} from "./types";
import { AppError } from "@warmdock/core";
import { rpcResult } from "./errors";
import {
  completeFromDto,
  profileFromDto,
  purchaseFromDto,
  snapshotFromDto,
  taskFromDto,
  unlockProgressFromDto,
} from "./mappers";

export function createTaskGateway(sb: SupabaseClient): TaskGateway {
  return {
    async listToday() {
      const { data, error } = await sb.rpc("list_today_tasks");
      return rpcResult<TaskDto[]>(data, error).map(taskFromDto);
    },
    async create(title, clientRequestId, timezone) {
      const { data, error } = await sb.rpc("create_task", {
        p_title: title,
        p_client_request_id: clientRequestId,
        p_timezone: timezone,
      });
      return taskFromDto(rpcResult<TaskDto>(data, error));
    },
    async updateTitle(taskId, title) {
      const { data, error } = await sb.rpc("update_task_title", {
        p_task_id: taskId,
        p_title: title,
      });
      return taskFromDto(rpcResult<TaskDto>(data, error));
    },
    async setDetail(taskId, input) {
      const { data, error } = await sb.rpc("set_task_detail", {
        p_task_id: taskId,
        p_difficulty: input.difficulty,
        p_difficulty_suggested: input.difficultySuggested,
        p_is_focus: input.isFocus ?? false,
      });
      return taskFromDto(rpcResult<TaskDto>(data, error));
    },
    async complete(taskId) {
      const { data, error } = await sb.rpc("complete_task", { p_task_id: taskId });
      return completeFromDto(rpcResult<CompleteTaskDto>(data, error));
    },
  };
}

export function createSessionGateway(sb: SupabaseClient): SessionGateway {
  return {
    async bootstrap() {
      const { data, error } = await sb.rpc("bootstrap");
      return snapshotFromDto(rpcResult<SnapshotDto>(data, error));
    },
  };
}

export function createUnlockGateway(sb: SupabaseClient): UnlockGateway {
  return {
    async progress() {
      const { data, error } = await sb.rpc("unlock_progress");
      return unlockProgressFromDto(rpcResult<UnlockProgressDto>(data, error));
    },
    async purchase(nodeId) {
      const { data, error } = await sb.rpc("purchase_unlock", { p_node_id: nodeId });
      return purchaseFromDto(rpcResult<PurchaseDto>(data, error));
    },
  };
}

export function createSettingsGateway(sb: SupabaseClient): SettingsGateway {
  return {
    async updatePreferences(patch: ProfilePatch) {
      const row: Record<string, unknown> = {};
      if (patch.reminderIntensity !== undefined) row.reminder_intensity = patch.reminderIntensity;
      if (patch.aiImprovementOptOut !== undefined) row.ai_improvement_opt_out = patch.aiImprovementOptOut;
      if (patch.locale !== undefined) row.locale = patch.locale;
      if (patch.themeMode !== undefined) row.theme_mode = patch.themeMode;

      const { data: sessionData } = await sb.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new AppError("NOT_AUTHENTICATED", "NOT_AUTHENTICATED");

      const { data, error } = await sb
        .from("profiles")
        .update(row)
        .eq("user_id", userId)
        .select()
        .single();
      return profileFromDto(rpcResult<ProfileDto>(data, error));
    },
  };
}
