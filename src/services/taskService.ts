import type { Task } from "../models/Task";
import type { DifficultyBand } from "../commands/types";
import { getTodayTasks, createTask, setTaskDetail } from "../commands/invoke";

/**
 * 取得今日任務列表
 */
export async function fetchTodayTasks(): Promise<Task[]> {
  return getTodayTasks();
}

/**
 * 建立新任務
 */
export async function createTaskWithFlow(title: string): Promise<Task> {
  return createTask({ title });
}

/**
 * 設定任務難度與 focus 狀態
 */
export async function setTaskDetailFlow(
  taskId: string,
  payload: {
    difficulty_suggested: DifficultyBand | null;
    difficulty_selected: 1 | 2 | 3 | 4 | 5;
    is_focus_task?: boolean;
  }
): Promise<Task> {
  return setTaskDetail({
    task_id: taskId,
    difficulty_suggested: payload.difficulty_suggested,
    difficulty_selected: payload.difficulty_selected,
    is_focus_task: payload.is_focus_task,
  });
}