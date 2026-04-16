import { useState } from "react";
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
  const showTaskCompletionFlash = useUIStore((s) => s.showTaskCompletionFlash);

  const [isCompleting, setIsCompleting] = useState(false);

  const needsSetup = !task.setup_completed;
  const canComplete = task.setup_completed && !task.completed;

  const handleComplete = async () => {
    if (!canComplete) return;
	setIsCompleting(true);
    try {
      const result = await completeTask(task.id);
      syncWalletAfterCompletion(result);
      syncSummaryAfterCompletion(result);
      if (result.all_tasks_completed) {
        setTimeout(() => setAllTasksCompleted(true), 420);
      } else {
		setTimeout(() => {
			showTaskCompletionFlash(
				task.title,
				result.reward_earned + result.bonus_earned
			);
		}, 420);
	  }
    } catch (err) {
      console.error("completeTask error:", err);
    } finally {
	  setTimeout(() => setIsCompleting(false), 420);
	}
  };

  const handleCardClick = () => {
    if (needsSetup && onOpenDetail) onOpenDetail();
  };

  return (
    <div
      className={`wd-task ${task.completed ? "wd-task--dim" : ""} ${
	    isCompleting ? "wd-task--completing" : ""
	  }`}
      onClick={handleCardClick}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
        disabled={!canComplete}
        className={`wd-check ${task.completed ? "wd-check--done" : ""}`}
        aria-label="完成任務"
      />

      {/* Title */}
      <span className="wd-task__title">{task.title}</span>

      {/* Meta: 難度分數 / focus 星 / 待設定提示 */}
      <span className="wd-task__meta">
        {needsSetup && (
          <span className="wd-tag wd-tag-gold">待設定</span>
        )}
        {!needsSetup && task.difficulty_selected != null && (
          <span className="wd-tag wd-tag-blue">{task.difficulty_selected}</span>
        )}
        {task.is_focus && <span className="wd-tag wd-tag-gold">★</span>}
      </span>
    </div>
  );
}