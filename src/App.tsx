import { useEffect } from "react";
import "./App.css";
import { Panel } from "./components/panel/Panel";
import { useBootstrap } from "./hooks/useBootstrap";
import { useUIStore } from "./store/useUIStore";
import { useDailyReset } from "./hooks/useDailyReset";
import { DevPanel } from "./components/dev/DevPanel";

function App() {
  useBootstrap();
  useDailyReset();

  const openPanel = useUIStore((state) => state.openPanel);
  useEffect(() => { openPanel(); }, [openPanel]);

  return (
    <div className="flex h-screen w-full items-start justify-end">
      <Panel />
      {import.meta.env.DEV && <DevPanel />}
    </div>
  );
}

export default App;