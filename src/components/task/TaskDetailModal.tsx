import { useState } from "react";
import type { Task } from "../../models/Task";
import type { DifficultyBand } from "../../commands/types";
import { useTaskStore } from "../../store/useTaskStore";
import { useUIStore } from "../../store/useUIStore";

const DIFFICULTY_OPTIONS: Record<DifficultyBand, (1 | 2 | 3 | 4 | 5)[]> = {
  easy: [1, 2, 3],
  medium: [2, 3, 4],
  hard: [3, 4, 5],
};

const BAND_LABELS: Record<DifficultyBand, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "困難",
};

/**
 * 簡易規則建議難度（MVP 版本，未來可替換）
 */
function suggestDifficulty(title: string): DifficultyBand {
  const lower = title.toLowerCase();
  const hardKeywords = ["報告", "重構", "遷移", "deploy", "release", "refactor"];
  const easyKeywords = ["買", "回覆", "確認", "check", "reply", "read"];

  if (hardKeywords.some((k) => lower.includes(k))) return "hard";
  if (easyKeywords.some((k) => lower.includes(k))) return "easy";
  return "medium";
}

type TaskDetailModalProps = {
  task: Task;
};

export function TaskDetailModal({ task }: TaskDetailModalProps) {
  const setTaskDetail = useTaskStore((s) => s.setTaskDetail);
  const closeTaskDetail = useUIStore((s) => s.closeTaskDetail);

  const suggested = suggestDifficulty(task.title);
  const options = DIFFICULTY_OPTIONS[suggested];

  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setTaskDetail(task.id, {
        difficulty_suggested: suggested,
        difficulty_selected: selected,
      });
      closeTaskDetail();
    } catch {
      // store 已記錄 error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[280px] rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-gray-800">設定任務難度</h2>
        <p className="mt-1 text-xs text-gray-500 truncate">{task.title}</p>

        {/* 系統建議 */}
        <div className="mt-4">
          <span className="text-xs text-gray-400">
            系統建議：{BAND_LABELS[suggested]}
          </span>
        </div>

        {/* 難度選擇 */}
        <div className="mt-3 flex gap-2">
          {options.map((score) => (
            <button
              key={score}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                selected === score
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setSelected(score)}
            >
              {score}
            </button>
          ))}
        </div>

        {/* 確認 */}
        <button
          className="mt-5 w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white
                     transition hover:bg-blue-600 disabled:opacity-40"
          disabled={!selected || isSubmitting}
          onClick={handleConfirm}
        >
          {isSubmitting ? "儲存中…" : "確認"}
        </button>
      </div>
    </div>
  );
}