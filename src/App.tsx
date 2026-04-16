import { useEffect } from "react";
import "./App.css";
import { Panel } from "./components/panel/Panel";
import { TriggerBubble } from "./components/trigger/TriggerBubble";
import { useBootstrap } from "./hooks/useBootstrap";
import { useUIStore } from "./store/useUIStore";
import { useDailyReset } from "./hooks/useDailyReset";
import { DevPanel } from "./components/dev/DevPanel";

function App() {
  useBootstrap();
  useDailyReset();

  const openPanel = useUIStore((state) => state.openPanel);

  // DEV: 啟動時自動開 panel 方便開發;正式版移除
  useEffect(() => {
    if (import.meta.env.DEV) openPanel();
  }, [openPanel]);

  return (
    <div className="wd-app">
      <TriggerBubble />
      <Panel />
      {import.meta.env.DEV && <DevPanel />}
    </div>
  );
}

export default App;