/** 今天的本地 ISO 日期(YYYY-MM-DD),對應 Rust SystemClock::today()。 */
export function todayISOString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "YYYY-MM-DD" → 使用者可讀日期,例如 "4月17日 週五"。 */
export function formatDisplayDate(
  isoDate?: string,
  locale: string = "zh-TW"
): string {
  const date = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 根據每日重置時間(HH:mm)計算距離下次重置的簡短字串:
 * 超過 1 小時 → "14h";不到 1 小時 → "35m";不到 1 分鐘 → "< 1m"。
 */
export function formatTimeUntilRefresh(
  refreshTime: string,
  now: Date = new Date()
): string {
  const [hhStr, mmStr] = refreshTime.split(":");
  const hh = parseInt(hhStr ?? "0", 10);
  const mm = parseInt(mmStr ?? "0", 10);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return "";
  }

  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMin = Math.floor((target.getTime() - now.getTime()) / 60000);
  if (diffMin < 1) return "< 1m";
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}
