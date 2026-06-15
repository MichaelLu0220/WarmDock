import { create } from "zustand";
import type { Task } from "@warmdock/core/types";

type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
};

type TaskActions = {
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
};

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),

  upsertTask: (task) =>
    set((state) => {
      const exists = state.tasks.some((t) => t.id === task.id);
      return {
        tasks: exists
          ? state.tasks.map((t) => (t.id === task.id ? task : t))
          : [...state.tasks, task],
      };
    }),

  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  setLoading: (value) => set({ isLoading: value }),
  setError: (message) => set({ error: message }),
}));
