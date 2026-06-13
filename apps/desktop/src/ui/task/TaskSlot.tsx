import { useRef, useState } from "react";
import { createTask } from "../../app/orchestrators/tasks";
import { useUIStore } from "../../app/stores/uiStore";
import { t } from "@warmdock/core/i18n";

export function TaskSlot() {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const openTaskDetail = useUIStore((s) => s.openTaskDetail);
  const setComposingTask = useUIStore((s) => s.setComposingTask);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const task = await createTask(trimmed);
      setValue("");
      openTaskDetail(task.id);
    } catch (err) {
      console.error("createTask failed:", err);
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
      placeholder={t("task.slotPlaceholder")}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={() => setComposingTask(true)}
      onBlur={() => setComposingTask(false)}
      disabled={isSubmitting}
    />
  );
}
