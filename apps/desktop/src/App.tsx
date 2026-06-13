import { useEffect } from "react";
import { useApplySettings } from "./app/hooks/useApplySettings";
import { useBootstrap } from "./app/hooks/useBootstrap";
import { useDailyReset } from "./app/hooks/useDailyReset";
import { openPanel } from "./app/orchestrators/windowFlow";
import { useUIStore } from "./app/stores/uiStore";
import { DevPanel } from "./ui/dev/DevPanel";
import { Panel } from "./ui/panel/Panel";
import { TriggerBubble } from "./ui/trigger/TriggerBubble";

function App() {
  useBootstrap();
  useDailyReset();
  useApplySettings();

  const isPanelOpen = useUIStore((s) => s.isPanelOpen);

  // DEV: 啟動時自動開 panel 方便開發;正式版只顯示 trigger
  useEffect(() => {
    if (import.meta.env.DEV) void openPanel();
  }, []);

  return (
    <div className="wd-app">
      <TriggerBubble />
      <Panel />
      {import.meta.env.DEV && isPanelOpen && <DevPanel />}
    </div>
  );
}

export default App;
