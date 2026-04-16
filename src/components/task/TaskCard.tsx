import type { Task } from "../../models/Task";
import { useTaskStore } from "../../store/useTaskStore";
import { useWalletStore } from "../../store/useWalletStore";
import { useSummaryStore } from "../../store/useSummaryStore";
import { useUIStore } from "../../store/useUIStore";

type TaskCardProps = {
  task: Task;
  onOpenDetail?: () => void;
};

export function TaskCard({ task, onOpenDetail }: TaskCardProps) {
  const completeTask = useTaskStore((s) => s.completeTask);
  const syncWalletAfterCompletion = useWalletStore((s) => s.syncWalletAfterCompletion);
  const syncSummaryAfterCompletion = useSummaryStore((s) => s.syncSummaryAfterCompletion);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);

  const needsSetup = !task.setup_completed;
  const canComplete = task.setup_completed && !task.completed;

  const handleComplete = async () => {
    if (!canComplete) return;
    try {
      const result = await completeTask(task.id);
	  console.log("completeTask result:", result);
      syncWalletAfterCompletion(result);
      syncSummaryAfterCompletion(result);
      if (result.all_tasks_completed) {
        setAllTasksCompleted(true);
      }
    } catch {
      // store 已記錄 error
	  console.error("completeTask error:", err);
    }
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm transition ${
        task.completed
          ? "border-gray-100 bg-gray-50 text-gray-400"
          : "border-gray-200 bg-white text-gray-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={!canComplete}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
            task.completed
              ? "border-green-300 bg-green-100 text-green-500"
              : canComplete
              ? "border-gray-300 hover:border-blue-400"
              : "border-gray-200 opacity-40 cursor-not-allowed"
          }`}
          aria-label="Complete task"
        >
          {task.completed && (
            /*<svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5l2.5 2.5 4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>*/
			<span className="text-[10px] leading-none text-green-500">✓</span>
          )}
        </button>

        {/* Title */}
        <span className={task.completed ? "line-through" : ""}>
          {task.title}
        </span>

        {/* 難度標籤 */}
        {task.difficulty_selected && !task.completed && (
          <span className="ml-auto shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
            {task.difficulty_selected}
          </span>
        )}

        {/* focus 標籤 */}
        {task.is_focus_task && !task.completed && (
          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
            ★
          </span>
        )}
      </div>

      {/* 尚未設定 detail */}
      {needsSetup && !task.completed && (
        <button
          className="mt-1.5 text-xs text-blue-500 hover:underline"
          onClick={onOpenDetail}
        >
          設定難度以完成任務
        </button>
      )}
    </div>
  );
}