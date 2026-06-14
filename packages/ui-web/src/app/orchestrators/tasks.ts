import { AppError, toAppError } from "@warmdock/core/errors";
import { errorMessage } from "@warmdock/core/i18n";
import type { CompleteTaskResult, Task, TaskDetailInput } from "@warmdock/core/types";
import { getGateways } from "../client";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useWalletStore } from "../stores/walletStore";

/** Mutations are disabled while offline (read-only cached view). */
function assertOnline(): void {
  if (useSessionStore.getState().isOffline) {
    throw new AppError("OFFLINE", errorMessage("OFFLINE"));
  }
}

function newRequestId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function loadTodayTasks(): Promise<void> {
  const store = useTaskStore.getState();
  store.setLoading(true);
  store.setError(null);
  try {
    store.setTasks(await getGateways().task.listToday());
  } catch (err) {
    useTaskStore.getState().setError(toAppError(err).message);
  } finally {
    useTaskStore.getState().setLoading(false);
  }
}

export async function createTask(title: string): Promise<Task> {
  useTaskStore.getState().setError(null);
  try {
    assertOnline();
    // cloud create needs a client-generated idempotency id + the device timezone
    const task = await getGateways().task.create(title, newRequestId(), deviceTimezone());
    useTaskStore.getState().upsertTask(task);
    return task;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}

export async function updateTaskTitle(taskId: string, title: string): Promise<Task> {
  useTaskStore.getState().setError(null);
  try {
    assertOnline();
    const task = await getGateways().task.updateTitle(taskId, title);
    useTaskStore.getState().upsertTask(task);
    return task;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}

export async function setTaskDetail(taskId: string, input: TaskDetailInput): Promise<Task> {
  useTaskStore.getState().setError(null);
  try {
    assertOnline();
    const task = await getGateways().task.setDetail(taskId, input);
    useTaskStore.getState().upsertTask(task);
    return task;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}

export async function completeTask(taskId: string): Promise<CompleteTaskResult> {
  useTaskStore.getState().setError(null);
  try {
    assertOnline();
    const result = await getGateways().task.complete(taskId);

    useTaskStore.getState().upsertTask(result.task);
    useWalletStore.getState().applyCompletion(result);
    useSessionStore.getState().setTodaySummary(result.todaySummary);

    return result;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}
