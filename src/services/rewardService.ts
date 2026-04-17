import {
  bootstrapApp,
  getUnlockProgress,
  purchaseUnlock,
} from "../commands/invoke";
import type { UserWallet } from "../models/UserWallet";
import type {
  UnlockStatus,
  UnlockProgressResponse,
  PurchaseUnlockResponse,
} from "../commands/types";

export async function fetchWalletAndUnlocks(): Promise<{
  wallet: UserWallet;
  unlocks: UnlockStatus;
}> {
  const data = await bootstrapApp();
  return { wallet: data.wallet, unlocks: data.unlocks };
}

/**
 * 取得完整解鎖進度(節點狀態 + 可用點數)。
 * 配置器 UI / PanelFooter 都吃這個。
 */
export async function fetchUnlockProgress(): Promise<UnlockProgressResponse> {
  return getUnlockProgress();
}

/**
 * 主動購買解鎖節點。
 * 錯誤(前置未滿足、點數不足、節點不存在)會透過 throw 傳到呼叫端。
 */
export async function purchaseUnlockNode(
  nodeId: string
): Promise<PurchaseUnlockResponse> {
  return purchaseUnlock({ node_id: nodeId });
}