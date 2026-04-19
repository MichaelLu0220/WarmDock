import { useUIStore } from "../../store/useUIStore";
import { useAppStore } from "../../store/useAppStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useAutoHide } from "../../hooks/useAutoHide";
import { TaskList } from "../task/TaskList";
import { TaskDetailModal } from "../task/TaskDetailModal";
import { PanelHeader } from "./PanelHeader";
import { PanelFooter } from "./PanelFooter";
import { PreviousDayCeremony, CompletionCeremony } from "../ceremony/CompletionCeremony";
import { TaskCompletionFlash } from "../ceremony/TaskCompletionFlash";
import { UnlockTree } from "../unlock/UnlockTree";

export function Panel() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isTaskDetailOpen = useUIStore((s) => s.isTaskDetailOpen);
  const isUnlockTreeOpen = useUIStore((s) => s.isUnlockTreeOpen); // 很重要
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const { isBootstrapping, isReady, bootstrapError } = useAppStore();
  const tasks = useTaskStore((s) => s.tasks);
  const allTasksCompleted = useUIStore((s) => s.allTasksCompleted);
  const isPreviousDaySummaryOpen = useUIStore((s) => s.isPreviousDaySummaryOpen);

  useAutoHide();   // ← 必須保留，負責自動隱藏

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  const showFooter =
    isReady && !isPreviousDaySummaryOpen && !allTasksCompleted;

  return (
    <>
      {/* 主 Panel 本體 */}
      <div className="wd-panel wd-card" data-open={isPanelOpen ? "true" : "false"}>
        <PanelHeader />

        <div className="wd-panel__body">
          {isBootstrapping && <p className="wd-panel__status">載入中…</p>}
          {bootstrapError && (
            <p className="wd-panel__status wd-panel__status--error">
              啟動失敗:{bootstrapError}
            </p>
          )}
          {isReady && (
            isPreviousDaySummaryOpen
              ? <PreviousDayCeremony />
              : allTasksCompleted
              ? <CompletionCeremony />
              : <TaskList />
          )}
        </div>

        {showFooter && <PanelFooter />}

        {isTaskDetailOpen && selectedTask && (
          <TaskDetailModal task={selectedTask} />
        )}

        <TaskCompletionFlash />
      </div>

      {/* UnlockTree 作為全螢幕 Overlay，放在外面才能蓋住整個畫面 */}
      {isUnlockTreeOpen && <UnlockTree />}
    </>
  );
}