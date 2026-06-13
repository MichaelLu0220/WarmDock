/**
 * Gateway 介面 — app 層唯一能接觸的資料存取面。
 * 現在由 data/tauri 實作;未來 Supabase 版只需提供同介面的 adapter,
 * 並在 data/index.ts 換掉組裝。所有方法失敗時拋 core 的 AppError。
 */

import type {
  BootstrapSnapshot,
  CompleteTaskResult,
  PurchaseUnlockResult,
  RefreshResult,
  Settings,
  SettingsPatch,
  Task,
  TaskDetailInput,
  UnlockProgress,
} from "../core/types";

export interface TaskGateway {
  listToday(): Promise<Task[]>;
  create(title: string): Promise<Task>;
  setDetail(taskId: string, input: TaskDetailInput): Promise<Task>;
  complete(taskId: string): Promise<CompleteTaskResult>;
}

export interface SessionGateway {
  bootstrap(): Promise<BootstrapSnapshot>;
  runDailyRefreshIfNeeded(): Promise<RefreshResult>;
}

export interface UnlockGateway {
  progress(): Promise<UnlockProgress>;
  purchase(nodeId: string): Promise<PurchaseUnlockResult>;
}

export interface SettingsGateway {
  update(patch: SettingsPatch): Promise<Settings>;
  setTriggerPosition(y: number): Promise<Settings>;
}

/** dev 工具專用,只在 debug build 有對應後端 */
export interface DevGateway {
  forceDailyRefresh(): Promise<RefreshResult>;
  resetAllData(): Promise<void>;
}

export interface Gateways {
  task: TaskGateway;
  session: SessionGateway;
  unlock: UnlockGateway;
  settings: SettingsGateway;
  dev: DevGateway;
}
