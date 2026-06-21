import { useRef } from "react";
import { useSessionStore, useTaskStore, useUIStore } from "@warmdock/app";
import { t } from "@warmdock/core/i18n";
import {
  CompletionCeremony,
  PreviousDayCeremony,
} from "../ceremony/CompletionCeremony";
import { TaskCompletionFlash } from "../ceremony/TaskCompletionFlash";
import { TaskDetailModal } from "../task/TaskDetailModal";
import { TaskList } from "../task/TaskList";
import { SettingsPage } from "../settings/SettingsPage";
import { AbilitiesPage } from "../unlock/AbilitiesPage";
import { Toast } from "../Toast";
import { BookFlip } from "./BookFlip";
import { PanelFooter } from "./PanelFooter";
import { PanelHeader } from "./PanelHeader";

const DRAG_THRESHOLD = 56; // 拽超過這距離(px)才翻頁

/**
 * 書本 app 外殼(web)。整個 app = 一本書:同一張卡(書的左半頁、書脊在右緣),
 * body 依 `appPage` 切換頁內容,頁與頁之間用「翻書」轉場(BookFlip)銜接。
 * 頁序:首頁(任務,原樣)→ 能力配置 → 設置。
 * 導覽全靠翻頁、不放按鈕:右緣往左拽 = 下一頁;左緣往右拽 = 上一頁(書脊在右緣)。
 * 能力/設置目前是 placeholder,內容在後續 phase 填入。
 */
export function Book() {
  const appPage = useUIStore((s) => s.appPage);
  const nextPage = useUIStore((s) => s.nextPage);
  const prevPage = useUIStore((s) => s.prevPage);
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);

  const isTaskDetailOpen = useUIStore((s) => s.isTaskDetailOpen);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const selectedTask = selectedTaskId
    ? (tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;

  // 頁緣拽動:left 緣往右 = 下一頁、right 緣往左 = 上一頁。
  const dragRef = useRef<{ edge: "left" | "right"; startX: number } | null>(
    null
  );
  const onEdgeDown =
    (edge: "left" | "right") => (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // 合成事件可能不支援
      }
      dragRef.current = { edge, startX: e.screenX };
    };
  const onEdgeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (!d) return;
    const dx = e.screenX - d.startX;
    // 貼合書本實體:書脊在右緣,抓右緣往左掀 = 翻到下一頁;抓左緣往右掀 = 回上一頁。
    if (d.edge === "right" && dx < -DRAG_THRESHOLD) nextPage(); // 右緣往左 → 下一頁
    if (d.edge === "left" && dx > DRAG_THRESHOLD) prevPage(); // 左緣往右 → 上一頁
  };

  return (
    <>
      <div className="wd-panel wd-card" data-open={isPanelOpen ? "true" : "false"}>
        {appPage === 0 && <HomePage />}
        {appPage === 1 && <AbilitiesPage />}
        {appPage === 2 && <SettingsPage />}

        {/* 頁緣可拽區(非按鈕):翻書導覽的唯一入口。 */}
        <div
          className="wd-book-edge wd-book-edge--left"
          aria-hidden
          onPointerDown={onEdgeDown("left")}
          onPointerUp={onEdgeUp}
          onPointerCancel={onEdgeUp}
        />
        <div
          className="wd-book-edge wd-book-edge--right"
          aria-hidden
          onPointerDown={onEdgeDown("right")}
          onPointerUp={onEdgeUp}
          onPointerCancel={onEdgeUp}
        />

        {/* 頁碼指示 */}
        <div className="wd-book-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`wd-book-dot ${i === appPage ? "is-active" : ""}`}
            />
          ))}
        </div>

        {isTaskDetailOpen && selectedTask && (
          <TaskDetailModal task={selectedTask} />
        )}
        <TaskCompletionFlash />
      </div>

      {/* 翻書轉場層(fixed,蓋在卡上演翻頁;只在 appPage 變化時出現) */}
      <BookFlip />
      <Toast />
    </>
  );
}

/** 首頁:沿用原本 chrome="app" 內容(header + 任務清單/慶祝 + footer)。 */
function HomePage() {
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isReady = useSessionStore((s) => s.isReady);
  const bootstrapError = useSessionStore((s) => s.bootstrapError);
  const allTasksCompleted = useSessionStore((s) => s.allTasksCompleted);
  const isOffline = useSessionStore((s) => s.isOffline);
  const isPreviousDaySummaryOpen = useUIStore((s) => s.isPreviousDaySummaryOpen);

  const showFooter = isReady && !isPreviousDaySummaryOpen && !allTasksCompleted;

  return (
    <>
      <PanelHeader chrome="app" />
      <div className="wd-panel__body">
        {isOffline && (
          <p className="wd-panel__status wd-panel__status--offline">
            {t("error.OFFLINE")}
          </p>
        )}
        {isBootstrapping && <p className="wd-panel__status">{t("app.loading")}</p>}
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
      {showFooter && <PanelFooter chrome="app" />}
    </>
  );
}
