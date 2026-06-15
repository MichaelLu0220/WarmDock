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

// A valid UUID v4 for the idempotency key (the DB column is uuid). Uses native
// randomUUID where available, else crypto.getRandomValues (React Native provides
// it via react-native-get-random-values).
function newRequestId(): string {
  const c: Crypto | undefined = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
    return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
  }
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

export async function discardTask(taskId: string): Promise<void> {
  useTaskStore.getState().setError(null);
  try {
    await getGateways().task.discard(taskId);
    useTaskStore.getState().removeTask(taskId);
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
