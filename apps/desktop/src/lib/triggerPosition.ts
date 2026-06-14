// Trigger vertical position is a desktop-only, device-local preference (it is not
// synced to the cloud profile). Persist it in localStorage.
const KEY = "wd-trigger-y";

export function loadTriggerPositionY(): number {
  try {
    const v = parseFloat(localStorage.getItem(KEY) ?? "");
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
  } catch {
    return 0.5;
  }
}

export function saveTriggerPositionY(ratio: number): void {
  try {
    localStorage.setItem(KEY, String(ratio));
  } catch {
    // ignore
  }
}
