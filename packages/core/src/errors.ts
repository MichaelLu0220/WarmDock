/** 對應 Rust error.rs 的錯誤碼,加上前端自己的 UNKNOWN */
export type AppErrorCode =
  | "TASK_NOT_FOUND"
  | "TASK_ALREADY_COMPLETED"
  | "TASK_SETUP_INCOMPLETE"
  | "TASK_DETAIL_ALREADY_SET"
  | "UNKNOWN_UNLOCK_NODE"
  | "ALREADY_UNLOCKED"
  | "REQUIREMENT_NOT_MET"
  | "INSUFFICIENT_POINTS"
  | "INVALID_INPUT"
  // cloud (Supabase) authoritative RPCs
  | "NOT_AUTHENTICATED"
  | "CYCLE_SETTLED"
  // client offline (read-only cache; mutations disabled)
  | "OFFLINE"
  | "DB_ERROR"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError("UNKNOWN", err.message);
  return new AppError("UNKNOWN", String(err));
}
