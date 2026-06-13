import { Component, type ErrorInfo, type ReactNode } from "react";
import { t } from "@warmdock/core/i18n";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("uncaught render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="wd-app">
        <div className="wd-panel wd-card" data-open="true">
          <div className="wd-ceremony">
            <div className="wd-ceremony__icon">✕</div>
            <h2 className="wd-ceremony__title">{t("app.crashTitle")}</h2>
            <p className="wd-ceremony__subtitle">{t("app.crashBody")}</p>
            <p className="wd-modal__hint">{this.state.error.message}</p>
            <button
              type="button"
              className="wd-btn wd-btn-primary"
              style={{ marginTop: 18 }}
              onClick={() => window.location.reload()}
            >
              {t("app.crashRetry")}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
