/**
 * 取得今天的 ISO 日期字串(YYYY-MM-DD),使用本地時區。
 * 對應 Rust 端 today_str() 的行為。
 */
export function todayISOString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 把 "YYYY-MM-DD" 字串格式化成使用者可讀的日期。
 * 預設 zh-TW,例如 "4月17日 週五"。
 */
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
 * 判斷兩個 ISO 日期字串是否為同一天。
 * 兩邊都是 "YYYY-MM-DD" 格式,直接字串比較即可。
 */
export function isSameDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a === b;
}

/**
 * 判斷某個 ISO 日期是否是「昨天」(以本地時區為準)。
 * 主要給 streak 邏輯和 previous day ceremony 用。
 */
export function isYesterday(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");
  return isoDate === `${y}-${m}-${d}`;
}