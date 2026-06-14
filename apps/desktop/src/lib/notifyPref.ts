// Desktop-local notification preferences (not synced to cloud in the first release).
export type ReminderIntensity = "off" | "low" | "normal" | "high";

const ENABLED = "wd-notif-enabled";
const INTENSITY = "wd-notif-intensity";
const DECIDED = "wd-notif-decided";

export function isDecided(): boolean {
  return localStorage.getItem(DECIDED) === "1";
}

export function isEnabled(): boolean {
  return localStorage.getItem(ENABLED) === "1";
}

export function setEnabled(on: boolean): void {
  try {
    localStorage.setItem(ENABLED, on ? "1" : "0");
    localStorage.setItem(DECIDED, "1");
  } catch {
    // ignore
  }
}

export function getIntensity(): ReminderIntensity {
  const v = localStorage.getItem(INTENSITY);
  return v === "off" || v === "low" || v === "high" ? v : "normal";
}

export function setIntensity(i: ReminderIntensity): void {
  try {
    localStorage.setItem(INTENSITY, i);
  } catch {
    // ignore
  }
}
