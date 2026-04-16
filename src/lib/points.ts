/**
 * 把積分格式化成字串。
 * 目前 MVP 只做最基本的數字顯示,未來若要做千分位或縮寫(1.2k)從這裡加。
 */
export function formatPoints(points: number): string {
  if (!Number.isFinite(points)) return "0";
  return String(Math.max(0, Math.trunc(points)));
}

/**
 * 格式化「已獲得積分」的 delta 顯示,例如 "+5"。
 * 給 CompletionCeremony 顯示今日/昨日獲得積分用。
 */
export function formatPointsDelta(points: number): string {
  return `+${formatPoints(points)}`;
}

/**
 * 格式化 pending today points 的附註,例如 "(+3)"。
 * pending === 0 時回傳 null,讓呼叫端決定要不要顯示。
 */
export function formatPendingSuffix(pending: number): string | null {
  if (!Number.isFinite(pending) || pending <= 0) return null;
  return `(+${formatPoints(pending)})`;
}

/**
 * 整合顯示「錢包積分 + pending 附註」,例如 "10 (+3)" 或 "10"。
 * 主要給 PanelHeader 使用。
 */
export function formatWalletDisplay(
  walletPoints: number,
  pendingPoints: number
): { main: string; suffix: string | null } {
  return {
    main: formatPoints(walletPoints),
    suffix: formatPendingSuffix(pendingPoints),
  };
}