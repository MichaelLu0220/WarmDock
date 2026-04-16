import type { Task } from "../../models/Task";

type TaskCardProps = {
  task: Task;
  onOpenDetail?: () => void;
};

export function TaskCard({ task, onOpenDetail }: TaskCardProps) {
  const needsSetup = !task.setup_completed;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm transition ${
        task.completed
          ? "border-gray-100 bg-gray-50 text-gray-400 line-through"
          : "border-gray-200 bg-white text-gray-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{task.title}</span>

        {/* 難度標籤 */}
        {task.difficulty_selected && !task.completed && (
          <span className="ml-2 shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
            {task.difficulty_selected}
          </span>
        )}

        {/* focus 標籤 */}
        {task.is_focus_task && !task.completed && (
          <span className="ml-1 shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
            ★
          </span>
        )}
      </div>

      {/* 尚未設定 detail，提示使用者點擊 */}
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