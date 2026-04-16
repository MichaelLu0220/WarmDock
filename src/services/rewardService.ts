import { bootstrapApp } from "../commands/invoke";
import type { UserWallet } from "../models/UserWallet";
import type { UnlockStatus } from "../commands/types";

export async function fetchWalletAndUnlocks(): Promise<{
  wallet: UserWallet;
  unlocks: UnlockStatus;
}> {
  const data = await bootstrapApp();
  return { wallet: data.wallet, unlocks: data.unlocks };
}