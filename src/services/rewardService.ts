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
import { useUIStore } from "../store/useUIStore";
import { useWalletStore } from "../store/useWalletStore";
import { useUnlockStore } from "../store/useUnlockStore";

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
 * 錯誤透過 throw 傳到呼叫端。
 */
export async function purchaseUnlockNode(
  nodeId: string
): Promise<PurchaseUnlockResponse> {
  return purchaseUnlock({ node_id: nodeId });
}

/**
 * 主動購買 + 同步三個 store(配置器元件呼叫這個)
 * ADR-006: cross-store coordination belongs in services.
 */
export async function purchaseAndSyncUnlock(
  nodeId: string
): Promise<PurchaseUnlockResponse> {
  const result = await purchaseUnlock({ node_id: nodeId });
  useUIStore.getState().setUnlocks(result.unlocks);
  useWalletStore.getState().syncWalletAfterPurchase(result);
  // 重拉 unlock progress 讓所有節點的 affordable / requirements_met 都刷新
  await useUnlockStore.getState().loadProgress();
  return result;
}