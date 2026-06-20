import { useEffect, useState } from "react";
import { analyzeTaskProposal, discardTask, setTaskDetail, updateTaskTitle } from "@warmdock/app";
import { useUIStore } from "@warmdock/app";
import { useUnlockStore } from "@warmdock/app";
import type { AiAnalysis } from "@warmdock/api";
import { difficultyBandLabel, t } from "@warmdock/core/i18n";
import { canShowFocusTaskOption } from "@warmdock/core/rules/unlock";
import { DIFFICULTY_OPTIONS } from "@warmdock/core/rules/task";
import type { Difficulty, Task } from "@warmdock/core/types";
import { resolveTaskSuggestion } from "./aiSuggestion";

type TaskDetailModalProps = {
  task: Task;
};

export function TaskDetailModal({ task }: TaskDetailModalProps) {
  const closeTaskDetail = useUIStore((s) => s.closeTaskDetail);
  const setComposingTask = useUIStore((s) => s.setComposingTask);
  const unlocks = useUnlockStore((s) => s.status);

  const [title, setTitle] = useState(task.title);
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // suggestion follows the (possibly edited) title
  const suggestion = resolveTaskSuggestion(title, analysis);
  const suggested = suggestion.suggestedBand;
  const options = DIFFICULTY_OPTIONS[suggested];
  const showFocusOption = canShowFocusTaskOption(unlocks);

  // persist a draft title edit (no-op if unchanged/empty)
  const persistTitleIfChanged = async () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      await updateTaskTitle(task.id, trimmed);
    }
  };

  // modal 關閉(卸載)時清 composing 狀態 + 移走焦點,
  // 防止焦點自動回到 TaskSlot 的 input
  useEffect(() => {
    return () => {
      setComposingTask(false);
      setTimeout(() => document.body.focus(), 10);
    };
  }, [setComposingTask]);

  useEffect(() => {
    const trimmed = title.trim();
    let cancelled = false;
    setAnalysis(null);

    if (!trimmed) {
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    void analyzeTaskProposal(trimmed)
      .then((result) => {
        if (cancelled) return;
        setAnalysis(result);
        if (result.available) setSelected(result.suggestedScore);
      })
      .finally(() => {
        if (!cancelled) setIsAnalyzing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [title]);

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await persistTitleIfChanged();
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

  // dismiss without setting difficulty:
  //  - empty title  => cancel the task (remove the draft, back to an empty slot)
  //  - otherwise    => keep any title edit, leave the task as a draft
  const handleLater = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (title.trim() === "") {
        await discardTask(task.id);
      } else {
        await persistTitleIfChanged();
      }
    } catch {
      // error 已記錄在 taskStore
    } finally {
      setIsSubmitting(false);
      closeTaskDetail();
    }
  };

  return (
    <div className="wd-overlay" onClick={() => void handleLater()}>
      <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="wd-modal__title">{t("detail.title")}</h2>
        <input
          className="wd-input wd-modal__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          aria-label={t("detail.title")}
        />

        <p className="wd-modal__hint">
          {t("detail.suggestion", { band: difficultyBandLabel(suggested) })}
          {isAnalyzing ? " ..." : ""}
        </p>

        <div className="wd-score-row">
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
          <label className="wd-modal__focus">
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
          className="wd-btn wd-btn-primary wd-modal__confirm"
          disabled={!selected || isSubmitting}
          onClick={() => void handleConfirm()}
        >
          {isSubmitting ? t("detail.saving") : t("detail.confirm")}
        </button>

        {/* dismiss without setting — the task stays "needs setup" and can't be
            completed until a difficulty is chosen later. */}
        <button
          type="button"
          className="wd-btn wd-modal__later"
          disabled={isSubmitting}
          onClick={() => void handleLater()}
        >
          {t("detail.later")}
        </button>
      </div>
    </div>
  );
}
