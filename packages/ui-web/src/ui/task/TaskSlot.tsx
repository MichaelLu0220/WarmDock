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

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const task = await createTask(trimmed);
      setValue("");
      openTaskDetail(task.id); // open the difficulty modal
    } catch (err) {
      console.error("createTask failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void submit();
  };

  // losing focus with text still entered also commits (and opens the modal);
  // keep composing flag alive until the modal takes over so auto-hide won't fire.
  const handleBlur = () => {
    if (value.trim() && !isSubmitting) {
      void submit();
    } else {
      setComposingTask(false);
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
      onBlur={handleBlur}
      disabled={isSubmitting}
    />
  );
}
