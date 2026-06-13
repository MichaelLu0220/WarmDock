/**
 * Map Supabase/PostgREST errors to the shared core AppError. Authoritative RPCs
 * raise SQLSTATE P0001 with the AppError code as the message (e.g.
 * 'TASK_ALREADY_COMPLETED'); everything else becomes DB_ERROR.
 */
import { AppError, type AppErrorCode } from "@warmdock/core";

interface PostgrestErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

const APP_CODES: ReadonlySet<string> = new Set<AppErrorCode>([
  "TASK_NOT_FOUND",
  "TASK_ALREADY_COMPLETED",
  "TASK_SETUP_INCOMPLETE",
  "TASK_DETAIL_ALREADY_SET",
  "UNKNOWN_UNLOCK_NODE",
  "ALREADY_UNLOCKED",
  "REQUIREMENT_NOT_MET",
  "INSUFFICIENT_POINTS",
  "INVALID_INPUT",
  "NOT_AUTHENTICATED",
  "CYCLE_SETTLED",
]);

export function mapPostgrestError(error: PostgrestErrorLike | null): AppError | null {
  if (!error) return null;
  const message = error.message ?? "";
  if (error.code === "P0001" && APP_CODES.has(message)) {
    return new AppError(message as AppErrorCode, message);
  }
  return new AppError("DB_ERROR", message || "database error", {
    pgcode: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/** Unwrap a Supabase `{ data, error }` result, throwing a mapped AppError. */
export function rpcResult<T>(data: T | null, error: PostgrestErrorLike | null): T {
  const mapped = mapPostgrestError(error);
  if (mapped) throw mapped;
  if (data === null) {
    throw new AppError("DB_ERROR", "empty response from server");
  }
  return data;
}
