import { create } from "zustand";
import type { Task } from "../models/Task";
import type { DifficultyBand } from "../commands/types";
import {
  fetchTodayTasks,
  createTaskWithFlow,
  setTaskDetailFlow,
} from "../services/taskService";

type TaskState = {
  tasks: Task[];
  isLoadingTasks: boolean;
  taskError: string | null;
};

type TaskActions = {
  loadTodayTasks: () => Promise<void>;
  createTask: (title: string) => Promise<Task>;
  setTaskDetail: (
    taskId: string,
    payload: {
      difficulty_suggested: DifficultyBand | null;
      difficulty_selected: 1 | 2 | 3 | 4 | 5;
      is_focus_task?: boolean;
    }
  ) => Promise<Task>;
  setTasks: (tasks: Task[]) => void;
};

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  tasks: [],
  isLoadingTasks: false,
  taskError: null,

  loadTodayTasks: async () => {
    set({ isLoadingTasks: true, taskError: null });
    try {
      const tasks = await fetchTodayTasks();
      set({ tasks });
    } catch (err) {
      set({ taskError: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  createTask: async (title: string) => {
    set({ taskError: null });
    try {
      const task = await createTaskWithFlow(title);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ taskError: message });
      throw err;
    }
  },

  setTaskDetail: async (taskId, payload) => {
    set({ taskError: null });
    try {
      const updated = await setTaskDetailFlow(taskId, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ taskError: message });
      throw err;
    }
  },

  setTasks: (tasks: Task[]) => set({ tasks }),
}));