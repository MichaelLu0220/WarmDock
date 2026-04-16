import { useUIStore } from "../../store/useUIStore";
import { useAppStore } from "../../store/useAppStore";
import { useTaskStore } from "../../store/useTaskStore";
import { TaskList } from "../task/TaskList";
import { TaskDetailModal } from "../task/TaskDetailModal";

export function Panel() {
    const isPanelOpen = useUIStore((s) => s.isPanelOpen);
    const isTaskDetailOpen = useUIStore((s) => s.isTaskDetailOpen);
    const selectedTaskId = useUIStore((s) => s.selectedTaskId);
    const { isBootstrapping, isReady, bootstrapError } = useAppStore();
    const tasks = useTaskStore((s) => s.tasks);

    const selectedTask = selectedTaskId
        ? tasks.find((t) => t.id === selectedTaskId) ?? null
        : null;

    if (!isPanelOpen) return null;

    return (
        <div className="flex h-full w-[320px] flex-col rounded-l-2xl bg-white shadow-lg">
            {/* Header placeholder — 第 4 階段再做 PanelHeader */}
            <div className="px-4 pt-5 pb-3">
                <h1 className="text-lg font-semibold text-gray-800">
                    {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })}
                </h1>
                <p className="mt-1 text-sm text-gray-500">今天想完成什麼？</p>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
                {isBootstrapping && (
                    <p className="text-sm text-gray-400">載入中…</p>
                )}
                {bootstrapError && (
                    <p className="text-sm text-red-500">啟動失敗：{bootstrapError}</p>
                )}
                {isReady && <TaskList />}
            </div>

            {/* Task Detail Modal */}
            {isTaskDetailOpen && selectedTask && (
                <TaskDetailModal task={selectedTask} />
            )}
        </div>
    );
}