import { toAppError } from "../../core/errors";
import type {
  CompleteTaskResult,
  Task,
  TaskDetailInput,
} from "../../core/types";
import { gateways } from "../../data";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useWalletStore } from "../stores/walletStore";

export async function loadTodayTasks(): Promise<void> {
  const store = useTaskStore.getState();
  store.setLoading(true);
  store.setError(null);
  try {
    store.setTasks(await gateways.task.listToday());
  } catch (err) {
    useTaskStore.getState().setError(toAppError(err).message);
  } finally {
    useTaskStore.getState().setLoading(false);
  }
}

export async function createTask(title: string): Promise<Task> {
  useTaskStore.getState().setError(null);
  try {
    const task = await gateways.task.create(title);
    useTaskStore.getState().upsertTask(task);
    return task;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}

export async function setTaskDetail(
  taskId: string,
  input: TaskDetailInput
): Promise<Task> {
  useTaskStore.getState().setError(null);
  try {
    const task = await gateways.task.setDetail(taskId, input);
    useTaskStore.getState().upsertTask(task);
    return task;
  } catch (err) {
    const appErr = toAppError(err);
    useTaskStore.getState().setError(appErr.message);
    throw appErr;
  }
}

/**
 * 完成任務:用後端 response 一次同步 task + wallet + summary,
 * 不留時間差,動畫層只做表演不碰權威數字。
 */
export async function completeTask(
  taskId: string
): Promise<CompleteTaskResult> {
  useTaskStore.getState().setError(null);
  try {
    const result = await gateways.task.complete(taskId);

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
