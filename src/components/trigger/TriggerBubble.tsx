import { useUIStore } from "../../store/useUIStore";

export function TriggerBubble() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const togglePanel = useUIStore((s) => s.togglePanel);

  return (
    <button
      onClick={togglePanel}
      className="wd-trigger"
      aria-label={isPanelOpen ? "關閉面板" : "開啟面板"}
    >
      <span className="wd-trigger__arrow">
        {isPanelOpen ? "›" : "‹"}
      </span>
    </button>
  );
}