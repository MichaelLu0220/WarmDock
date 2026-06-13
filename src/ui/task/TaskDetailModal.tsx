import { useEffect, useState } from "react";
import { setTaskDetail } from "../../app/orchestrators/tasks";
import { useUIStore } from "../../app/stores/uiStore";
import { useUnlockStore } from "../../app/stores/unlockStore";
import { difficultyBandLabel, t } from "../../core/i18n";
import { canShowFocusTaskOption } from "../../core/rules/unlock";
import { DIFFICULTY_OPTIONS, suggestDifficulty } from "../../core/rules/task";
import type { Difficulty, Task } from "../../core/types";

type TaskDetailModalProps = {
  task: Task;
};

export function TaskDetailModal({ task }: TaskDetailModalProps) {
  const closeTaskDetail = useUIStore((s) => s.closeTaskDetail);
  const setComposingTask = useUIStore((s) => s.setComposingTask);
  const unlocks = useUnlockStore((s) => s.status);

  const suggested = suggestDifficulty(task.title);
  const options = DIFFICULTY_OPTIONS[suggested];
  const showFocusOption = canShowFocusTaskOption(unlocks);

  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // modal 關閉(卸載)時清 composing 狀態 + 移走焦點,
  // 防止焦點自動回到 TaskSlot 的 input
  useEffect(() => {
    return () => {
      setComposingTask(false);
      setTimeout(() => document.body.focus(), 10);
    };
  }, [setComposingTask]);

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setTaskDetail(task.id, {
        difficultySuggested: suggested,
        difficulty: selected,
        isFocus: showFocusOption ? isFocus : false,
      });
      closeTaskDetail();
    } catch {
      // error 已記錄在 taskStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wd-overlay">
      <div className="wd-modal">
        <h2 className="wd-modal__title">{t("detail.title")}</h2>
        <p className="wd-modal__subtitle">{task.title}</p>

        <p className="wd-modal__hint">
          {t("detail.suggestion", { band: difficultyBandLabel(suggested) })}
        </p>

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

        {showFocusOption && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <button
              type="button"
              className={`wd-check ${isFocus ? "wd-check--done" : ""}`}
              aria-label={t("detail.focusOption")}
              onClick={() => setIsFocus((v) => !v)}
            />
            <span onClick={() => setIsFocus((v) => !v)}>
              {t("detail.focusOption")}
            </span>
          </label>
        )}

        <button
          type="button"
          className="wd-btn wd-btn-primary"
          style={{ marginTop: 18, width: "100%" }}
          disabled={!selected || isSubmitting}
          onClick={() => void handleConfirm()}
        >
          {isSubmitting ? t("detail.saving") : t("detail.confirm")}
        </button>
      </div>
    </div>
  );
}
