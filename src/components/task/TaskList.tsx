import { useTaskStore } from "../../store/useTaskStore";
import { useUIStore } from "../../store/useUIStore";
import { getVisibleSlotCount } from "../../lib/unlock";
import { TaskSlot } from "./TaskSlot";
import { TaskCard } from "./TaskCard";



export function TaskList() {
    const tasks = useTaskStore((s) => s.tasks);
    const openTaskDetail = useUIStore((s) => s.openTaskDetail);
	const unlocks = useUIStore((s) => s.unlocks);
	const visibleSlots = getVisibleSlotCount(unlocks);
    const emptySlotCount = Math.max(0, visibleSlots - tasks.length);
	
	
    return (
        <div className="flex flex-col gap-2" style={{ padding: "0 18px 4px 16px" }}>
            {/* 已建立的任務 */}
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onOpenDetail={() => openTaskDetail(task.id)}
                />
            ))}

            {/* 空 slot */}
            {Array.from({ length: emptySlotCount }).map((_, i) => (
                <TaskSlot key={`slot-${i}`} />
            ))}
        </div>
    );
}