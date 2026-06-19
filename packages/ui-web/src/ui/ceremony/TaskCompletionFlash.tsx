import { useUIStore } from "@warmdock/app";
import { t } from "@warmdock/core/i18n";
import { formatPointsDelta } from "@warmdock/core/rules/points";

export function TaskCompletionFlash() {
  const flash = useUIStore((s) => s.taskCompletionFlash);
  const hideTaskCompletionFlash = useUIStore((s) => s.hideTaskCompletionFlash);

  if (!flash) return null;

  return (
    <div
      className="wd-overlay wd-flash"
      onClick={hideTaskCompletionFlash}
      role="button"
    >
      <div className="wd-ceremony wd-flash__body" style={{ pointerEvents: "none" }}>
        <div className="wd-ceremony__icon wd-flash__badge">✓</div>
        <h2 className="wd-ceremony__title">{t("ceremony.flashTitle")}</h2>
        <p className="wd-ceremony__subtitle wd-flash__task">{flash.taskTitle}</p>
        <div className="wd-ceremony__stat-value wd-ceremony__stat-value--gold wd-flash__points">
          {formatPointsDelta(flash.pointsEarned)}
        </div>
        <p className="wd-modal__hint wd-flash__hint">{t("ceremony.flashHint")}</p>
      </div>
    </div>
  );
}
