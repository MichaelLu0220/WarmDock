import { useTaskStore } from "../../app/stores/taskStore";
import { useUIStore } from "../../app/stores/uiStore";
import { useUnlockStore } from "../../app/stores/unlockStore";
import { getVisibleSlotCount } from "@warmdock/core/rules/unlock";
import { TaskCard } from "./TaskCard";
import { TaskSlot } from "./TaskSlot";

const STAGGER_MS = 40;

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks);
  const openTaskDetail = useUIStore((s) => s.openTaskDetail);
  const unlocks = useUnlockStore((s) => s.status);

  const visibleSlots = getVisibleSlotCount(unlocks);
  const emptySlotCount = Math.max(0, visibleSlots - tasks.length);

  return (
    <div className="wd-task-list">
      {tasks.map((task, i) => (
        <div
          key={task.id}
          className="wd-anim-rise"
          style={{ animationDelay: `${i * STAGGER_MS}ms` }}
        >
          <TaskCard task={task} onOpenDetail={() => openTaskDetail(task.id)} />
        </div>
      ))}

      {Array.from({ length: emptySlotCount }).map((_, i) => (
        <div
          key={`slot-${i}`}
          className="wd-anim-rise"
          style={{ animationDelay: `${(tasks.length + i) * STAGGER_MS}ms` }}
        >
          <TaskSlot />
        </div>
      ))}
    </div>
  );
}
