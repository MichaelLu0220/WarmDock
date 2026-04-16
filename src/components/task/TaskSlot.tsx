import { useState, useRef } from "react";
import { useTaskStore } from "../../store/useTaskStore";
import { useUIStore } from "../../store/useUIStore";

export function TaskSlot() {
    const [value, setValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const createTask = useTaskStore((s) => s.createTask);
    const openTaskDetail = useUIStore((s) => s.openTaskDetail);

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        const trimmed = value.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const task = await createTask(trimmed);
            setValue("");
            openTaskDetail(task.id);
        } catch {
            console.error("createTask failed");
        } finally {
            setIsSubmitting(false);
            inputRef.current?.focus();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            className="wd-slot"
            placeholder="+ 新增任務..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
        />
    );
}