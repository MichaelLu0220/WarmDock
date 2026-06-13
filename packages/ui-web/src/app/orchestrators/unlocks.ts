import { toAppError } from "@warmdock/core/errors";
import type { PurchaseUnlockResult } from "@warmdock/core/types";
import { getGateways } from "../client";
import { useUnlockStore } from "../stores/unlockStore";
import { useWalletStore } from "../stores/walletStore";

export async function loadUnlockProgress(): Promise<void> {
  const store = useUnlockStore.getState();
  store.setLoading(true);
  store.setError(null);
  try {
    store.setProgress(await getGateways().unlock.progress());
  } catch (err) {
    useUnlockStore.getState().setError(toAppError(err).message);
  } finally {
    useUnlockStore.getState().setLoading(false);
  }
}

export async function purchaseUnlock(nodeId: string): Promise<PurchaseUnlockResult> {
  useUnlockStore.getState().setError(null);
  try {
    const result = await getGateways().unlock.purchase(nodeId);

    useUnlockStore.getState().setStatus(result.unlocks);
    useWalletStore.getState().applyPurchase(result);
    await loadUnlockProgress();

    return result;
  } catch (err) {
    const appErr = toAppError(err);
    useUnlockStore.getState().setError(appErr.message);
    throw appErr;
  }
}
