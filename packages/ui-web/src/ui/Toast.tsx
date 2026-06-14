import { useEffect } from "react";
import { useUIStore } from "../app/stores/uiStore";

const VISIBLE_MS = 2500;

/** Transient toast that fades in and out (e.g. "Back online"). */
export function Toast() {
  const notice = useUIStore((s) => s.notice);
  const clearNotice = useUIStore((s) => s.clearNotice);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => clearNotice(), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [notice?.id, clearNotice]);

  if (!notice) return null;
  return (
    <div key={notice.id} className="wd-toast" role="status">
      {notice.text}
    </div>
  );
}
