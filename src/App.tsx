import { useEffect } from "react";
import "./App.css";
import { Panel } from "./components/panel/Panel";
import { useBootstrap } from "./hooks/useBootstrap";
import { useUIStore } from "./store/useUIStore";

function App() {
  useBootstrap();

  const openPanel = useUIStore((state) => state.openPanel);

  useEffect(() => {
    openPanel();
  }, [openPanel]);

  return <Panel />;
}

export default App;