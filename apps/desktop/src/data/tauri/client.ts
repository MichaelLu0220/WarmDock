import { invoke } from "@tauri-apps/api/core";
import { AppError, type AppErrorCode } from "@warmdock/core/errors";
import type { CommandErrorDto } from "./dto";

const KNOWN_CODES: ReadonlySet<string> = new Set([
  "TASK_NOT_FOUND",
  "TASK_ALREADY_COMPLETED",
  "TASK_SETUP_INCOMPLETE",
  "TASK_DETAIL_ALREADY_SET",
  "UNKNOWN_UNLOCK_NODE",
  "ALREADY_UNLOCKED",
  "REQUIREMENT_NOT_MET",
  "INSUFFICIENT_POINTS",
  "INVALID_INPUT",
  "DB_ERROR",
] satisfies AppErrorCode[]);

function isErrorDto(value: unknown): value is CommandErrorDto {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CommandErrorDto).code === "string" &&
    typeof (value as CommandErrorDto).message === "string"
  );
}

/** Tauri command 呼叫的唯一入口:後端結構化錯誤 → core AppError */
export async function call<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (raw) {
    if (isErrorDto(raw)) {
      const code = (
        KNOWN_CODES.has(raw.code) ? raw.code : "UNKNOWN"
      ) as AppErrorCode;
      throw new AppError(code, raw.message, raw.details);
    }
    throw new AppError("UNKNOWN", typeof raw === "string" ? raw : String(raw));
  }
}
