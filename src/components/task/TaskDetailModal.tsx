import { useState, useEffect } from "react";
import type { Task } from "../../models/Task";
import { useTaskStore } from "../../store/useTaskStore";
import { useUIStore } from "../../store/useUIStore";
import {
  DIFFICULTY_OPTIONS,
  BAND_LABELS,
  suggestDifficulty,
} from "../../lib/difficulty";

type TaskDetailModalProps = {
  task: Task;
};

export function TaskDetailModal({ task }: TaskDetailModalProps) {
  const setTaskDetail = useTaskStore((s) => s.setTaskDetail);
  const closeTaskDetail = useUIStore((s) => s.closeTaskDetail);
  const setComposingTask = useUIStore((s) => s.setComposingTask);

  const suggested = suggestDifficulty(task.title);
  const options = DIFFICULTY_OPTIONS[suggested];

  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 關鍵修正：當 modal 關閉時，強制清除 composing 狀態 + 移走焦點
  useEffect(() => {
    return () => {
      // modal 卸載時執行（包含關閉）
      setComposingTask(false);
      
      // 把焦點移到 document body，防止自動回到 TaskSlot 的 input
      setTimeout(() => {
        document.body.focus();
        // 或者如果你想讓焦點回到最後一個 TaskSlot，可以這樣：
        // const lastInput = document.querySelector('.wd-slot:last-of-type') as HTMLInputElement;
        // lastInput?.focus();
      }, 10);
    };
  }, [setComposingTask]);

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
    <div className="wd-overlay">
      <div className="wd-modal">
        <h2 className="wd-modal__title">設定任務難度</h2>
        <p className="wd-modal__subtitle">{task.title}</p>

        <p className="wd-modal__hint">
          系統建議: {BAND_LABELS[suggested]}
        </p>

        {/* 難度選擇 */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {options.map((score) => (
            <button
              key={score}
              type="button"
              className={`wd-score ${selected === score ? "wd-score--selected" : ""}`}
              onClick={() => setSelected(score)}
            >
              {score}
            </button>
          ))}
        </div>

        {/* 確認 */}
        <button
          type="button"
          className="wd-btn wd-btn-primary"
          style={{ marginTop: 18, width: "100%" }}
          disabled={!selected || isSubmitting}
          onClick={handleConfirm}
        >
          {isSubmitting ? "儲存中..." : "確認"}
        </button>
      </div>
    </div>
  );
}