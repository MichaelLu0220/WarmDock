import { toAppError } from "@warmdock/core/errors";
import type { PurchaseUnlockResult } from "@warmdock/core/types";
import { gateways } from "../../data";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";

export async function loadUnlockProgress(): Promise<void> {
  const store = useUnlockStore.getState();
  store.setLoading(true);
  store.setError(null);
  try {
    store.setProgress(await gateways.unlock.progress());
  } catch (err) {
    useUnlockStore.getState().setError(toAppError(err).message);
  } finally {
    useUnlockStore.getState().setLoading(false);
  }
}

/**
 * 購買解鎖:status + wallet + progress 三者用同一個 response 與
 * 後續重拉同步,取代舊 rewardService.purchaseAndSyncUnlock。
 */
export async function purchaseUnlock(
  nodeId: string
): Promise<PurchaseUnlockResult> {
  useUnlockStore.getState().setError(null);
  try {
    const result = await gateways.unlock.purchase(nodeId);

    useUnlockStore.getState().setStatus(result.unlocks);
    useWalletStore.getState().applyPurchase(result);
    // 重拉 progress 讓所有節點的 affordable / requirementsMet 刷新
    await loadUnlockProgress();

    return result;
  } catch (err) {
    const appErr = toAppError(err);
    useUnlockStore.getState().setError(appErr.message);
    throw appErr;
  }
}
