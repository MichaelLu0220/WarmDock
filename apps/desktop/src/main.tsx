import React from "react";
import ReactDOM from "react-dom/client";
import "@warmdock/ui-web/styles.css";
import { ErrorBoundary, injectMotionVars } from "@warmdock/ui-web";
import App from "./App";
import { applyCachedTheme } from "./app/theme";

applyCachedTheme();
injectMotionVars();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
