import { create } from "zustand";
import type {
  CompleteTaskResult,
  PurchaseUnlockResult,
  Wallet,
} from "@warmdock/core/types";

type WalletState = {
  wallet: Wallet | null;
};

type WalletActions = {
  setWallet: (wallet: Wallet) => void;
  /** 完成任務後,用後端 response 的權威數字同步 */
  applyCompletion: (result: CompleteTaskResult) => void;
  /** 購買解鎖後同步(只動 unlock 相關欄位,結算流不受影響) */
  applyPurchase: (result: PurchaseUnlockResult) => void;
};

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
  wallet: null,

  setWallet: (wallet) => set({ wallet }),

  applyCompletion: (result) =>
    set((state) => ({
      wallet: state.wallet
        ? {
            ...state.wallet,
            pendingTodayPoints: result.pendingTodayPoints,
            walletPoints: result.walletPoints,
            streakDays: result.streakDays,
            lifetimePointsEarned:
              state.wallet.lifetimePointsEarned + result.availablePointsDelta,
          }
        : null,
    })),

  applyPurchase: (result) =>
    set((state) => ({
      wallet: state.wallet
        ? {
            ...state.wallet,
            pointsSpentOnUnlocks: result.pointsSpentOnUnlocks,
            pendingTodayUnlockSpent: result.pendingTodayUnlockSpent,
          }
        : null,
    })),
}));
