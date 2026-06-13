import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { applyCachedTheme } from "./app/hooks/useApplySettings";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { injectMotionVars } from "./ui/motion";

applyCachedTheme();
injectMotionVars();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
