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
            // 建立成功後自動開啟 detail modal
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
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                 placeholder-gray-400 outline-none transition
                 focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-300
                 disabled:opacity-50"
            placeholder="Add a task..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
        />
    );
}