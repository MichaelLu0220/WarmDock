import { t } from "@warmdock/core/i18n";
import { useAutoHide } from "../../app/hooks/useAutoHide";
import { useSessionStore } from "../../app/stores/sessionStore";
import { useTaskStore } from "../../app/stores/taskStore";
import { useUIStore } from "../../app/stores/uiStore";
import {
  CompletionCeremony,
  PreviousDayCeremony,
} from "../ceremony/CompletionCeremony";
import { TaskCompletionFlash } from "../ceremony/TaskCompletionFlash";
import { SettingsPanel } from "../settings/SettingsPanel";
import { TaskDetailModal } from "../task/TaskDetailModal";
import { TaskList } from "../task/TaskList";
import { UnlockTree } from "../unlock/UnlockTree";
import { PanelFooter } from "./PanelFooter";
import { PanelHeader } from "./PanelHeader";

export function Panel() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isTaskDetailOpen = useUIStore((s) => s.isTaskDetailOpen);
  const isUnlockTreeOpen = useUIStore((s) => s.isUnlockTreeOpen);
  const isUnlockTreeClosing = useUIStore((s) => s.isUnlockTreeClosing);
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const isPreviousDaySummaryOpen = useUIStore(
    (s) => s.isPreviousDaySummaryOpen
  );

  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isReady = useSessionStore((s) => s.isReady);
  const bootstrapError = useSessionStore((s) => s.bootstrapError);
  const allTasksCompleted = useSessionStore((s) => s.allTasksCompleted);

  const tasks = useTaskStore((s) => s.tasks);

  useAutoHide();

  const selectedTask = selectedTaskId
    ? (tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;

  const showFooter = isReady && !isPreviousDaySummaryOpen && !allTasksCompleted;

  return (
    <>
      {/* 首頁永遠留在右側原位:能力配置開啟(含放大)時都不關閉首頁,
          能力配置卡片翻到「下一頁」覆蓋其上;放大時卡片移到中央,
          首頁仍留在右側可見。 */}
      <div
        className="wd-panel wd-card"
        data-open={isPanelOpen ? "true" : "false"}
      >
        <PanelHeader />

        <div className="wd-panel__body">
          {isBootstrapping && (
            <p className="wd-panel__status">{t("app.loading")}</p>
          )}
          {bootstrapError && (
            <p className="wd-panel__status wd-panel__status--error">
              {t("app.bootstrapFailed", { message: bootstrapError })}
            </p>
          )}
          {isReady &&
            (isPreviousDaySummaryOpen ? (
              <PreviousDayCeremony />
            ) : allTasksCompleted ? (
              <CompletionCeremony />
            ) : (
              <TaskList />
            ))}
        </div>

        {showFooter && <PanelFooter />}

        {isTaskDetailOpen && selectedTask && (
          <TaskDetailModal task={selectedTask} />
        )}

        {isSettingsOpen && <SettingsPanel />}

        <TaskCompletionFlash />
      </div>

      {/* UnlockTree 只在開啟(含關閉動畫進行中)時掛載 — 完全關閉後不在 DOM,
          才不會在視窗 resize(收合/喚出)時於左上角閃一下它的 header 按鈕。
          isUnlockTreeClosing 期間保留掛載,讓書脊翻出動畫跑完再卸載。 */}
      {(isUnlockTreeOpen || isUnlockTreeClosing) && <UnlockTree />}
    </>
  );
}
