/**
 * 根據使用者設定的每日刷新時間(HH:mm),計算距離下次刷新還剩多久。
 * 回傳簡短字串:
 *   - 超過 1 小時:`14h`
 *   - 不到 1 小時:`35m`
 *   - 不到 1 分鐘:`< 1m`
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

  // 今日的刷新時間點
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);

  // 如果今日的目標已過,目標是明天同一時刻
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "< 1m";
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h`;
}