import type { Wallet } from "../types";

/** 目前可花點數 = 已入帳 + 今日待入帳 - 今日已花在解鎖(鏡像後端規則) */
export function availablePoints(wallet: Wallet): number {
  return (
    wallet.walletPoints +
    wallet.pendingTodayPoints -
    wallet.pendingTodayUnlockSpent
  );
}

/** 積分格式化。未來要做千分位或縮寫(1.2k)從這裡加。 */
export function formatPoints(points: number): string {
  if (!Number.isFinite(points)) return "0";
  return String(Math.max(0, Math.trunc(points)));
}

/** "+5" — ceremony 顯示獲得積分用 */
export function formatPointsDelta(points: number): string {
  return `+${formatPoints(points)}`;
}

/** "(+3)" — pending 附註;0 回傳 null 讓呼叫端決定要不要顯示 */
export function formatPendingSuffix(pending: number): string | null {
  if (!Number.isFinite(pending) || pending <= 0) return null;
  return `(+${formatPoints(pending)})`;
}

/** "10 (+3)" — PanelHeader 的錢包顯示 */
export function formatWalletDisplay(
  walletPoints: number,
  pendingPoints: number
): { main: string; suffix: string | null } {
  return {
    main: formatPoints(walletPoints),
    suffix: formatPendingSuffix(pendingPoints),
  };
}
