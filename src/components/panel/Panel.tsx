import { useUIStore } from "../../store/useUIStore";
import { useAppStore } from "../../store/useAppStore";
import { useTaskStore } from "../../store/useTaskStore";
import { TaskList } from "../task/TaskList";
import { TaskDetailModal } from "../task/TaskDetailModal";
import { PanelHeader } from "./PanelHeader";
import { PreviousDayCeremony, CompletionCeremony } from "../ceremony/CompletionCeremony";

export function Panel() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isTaskDetailOpen = useUIStore((s) => s.isTaskDetailOpen);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const { isBootstrapping, isReady, bootstrapError } = useAppStore();
  const tasks = useTaskStore((s) => s.tasks);
  const allTasksCompleted = useUIStore((s) => s.allTasksCompleted);
  const isPreviousDaySummaryOpen = useUIStore((s) => s.isPreviousDaySummaryOpen);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  return (
    <div className="wd-panel wd-card" data-open={isPanelOpen ? "true" : "false"}>
      <PanelHeader />

      <div className="wd-panel__body">
        {isBootstrapping && (
          <p className="wd-panel__status">載入中…</p>
        )}
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

      {isTaskDetailOpen && selectedTask && (
        <TaskDetailModal task={selectedTask} />
      )}
    </div>
  );
}