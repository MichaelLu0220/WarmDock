import { useUIStore } from "../../store/useUIStore";
import { formatPointsDelta } from "../../lib/points";

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
      <div className="wd-ceremony" style={{ pointerEvents: "none" }}>
        <div className="wd-ceremony__icon">✓</div>
        <h2 className="wd-ceremony__title">完成一項承諾。</h2>
        <p
          className="wd-ceremony__subtitle"
          style={{
            maxWidth: 220,
            wordBreak: "break-all",
          }}
        >
          {flash.taskTitle}
        </p>
        <div
          className="wd-ceremony__stat-value wd-ceremony__stat-value--gold"
          style={{ marginTop: 16, fontSize: 22 }}
        >
          {formatPointsDelta(flash.pointsEarned)}
        </div>
        <p className="wd-modal__hint" style={{ marginTop: 14 }}>
          點擊任一處繼續
        </p>
      </div>
    </div>
  );
}