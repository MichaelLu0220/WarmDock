import { useState } from "react";
import { completeTask } from "@warmdock/app";
import { useSessionStore } from "@warmdock/app";
import { useUIStore } from "@warmdock/app";
import { useWalletStore } from "@warmdock/app";
import { difficultyBandLabel, t } from "@warmdock/core/i18n";
import type { Task } from "@warmdock/core/types";
import {
  canComplete as canCompleteTask,
  isCompleted,
  needsSetup as taskNeedsSetup,
} from "@warmdock/core/rules/task";
import { DUR_TASK_COMPLETE } from "../motion";

type TaskCardProps = {
  task: Task;
  onOpenDetail?: () => void;
};

export function TaskCard({ task, onOpenDetail }: TaskCardProps) {
  const setAllTasksCompleted = useSessionStore((s) => s.setAllTasksCompleted);
  const showTaskCompletionFlash = useUIStore((s) => s.showTaskCompletionFlash);
  const triggerHeaderPointsFlash = useUIStore(
    (s) => s.triggerHeaderPointsFlash
  );

  const [isCompleting, setIsCompleting] = useState(false);

  const needsSetup = taskNeedsSetup(task);
  const canComplete = canCompleteTask(task);
  const done = isCompleted(task);

  const handleComplete = async () => {
    if (!canComplete || isCompleting) return;
    setIsCompleting(true);

    // 完成前快照 pending,header flash 的「舊值」用快照而不是事後回讀(消滅 race)
    const oldPending =
      useWalletStore.getState().wallet?.pendingTodayPoints ?? 0;

    try {
      const result = await completeTask(task.id);
      const gained = result.rewardEarned + result.bonusEarned;

      triggerHeaderPointsFlash(gained, oldPending);

      // 等卡片 steps 動畫跑完,再進 flash / ceremony
      setTimeout(() => {
        if (result.allTasksCompleted) {
          setAllTasksCompleted(true);
        } else {
          showTaskCompletionFlash(task.title, gained);
        }
      }, DUR_TASK_COMPLETE);
    } catch (err) {
      console.error("completeTask error:", err);
    } finally {
      setTimeout(() => setIsCompleting(false), DUR_TASK_COMPLETE);
    }
  };

  return (
    <div
      className={`wd-task ${isCompleted(task) ? "wd-task--dim" : ""} ${
        isCompleting ? "wd-task--completing" : ""
      }`}
      onClick={() => {
        if (needsSetup && onOpenDetail) onOpenDetail();
      }}
      style={{ cursor: needsSetup ? "pointer" : "default" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleComplete();
        }}
        disabled={!canComplete}
        className={`wd-check ${isCompleted(task) ? "wd-check--done" : ""}`}
        aria-label={t("task.completeAria")}
      />

      <span className="wd-task__title">{task.title}</span>

      <span className="wd-task__meta">
        {needsSetup && (
          <span className="wd-tag wd-tag-gold">{t("task.needsSetup")}</span>
        )}
        {/* 完成的任務不再顯示難度/Focus 標籤(只留刪除線標題,對齊首頁 mock 卡) */}
        {!needsSetup && !done && task.difficultySuggested != null && (
          <span className="wd-tag wd-tag-blue">
            {difficultyBandLabel(task.difficultySuggested)}
          </span>
        )}
        {!done && task.isFocus && (
          <span className="wd-tag wd-tag-gold">{t("task.focus")}</span>
        )}
      </span>
    </div>
  );
}
