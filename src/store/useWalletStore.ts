import { create } from "zustand";
import type { UserWallet } from "../models/UserWallet";
import type {
  CompleteTaskResponse,
  PurchaseUnlockResponse,
} from "../commands/types";

type WalletState = {
  wallet: UserWallet | null;
};

type WalletActions = {
  setWallet: (wallet: UserWallet) => void;
  syncWalletAfterCompletion: (result: CompleteTaskResponse) => void;
  syncWalletAfterPurchase: (result: PurchaseUnlockResponse) => void;
};

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
  wallet: null,

  setWallet: (wallet) => set({ wallet }),

  syncWalletAfterCompletion: (result) =>
    set((state) => ({
      wallet: state.wallet
        ? {
            ...state.wallet,
            pending_today_points: result.pending_today_points,
            wallet_points: result.wallet_points,
            streak_days: result.streak_days,
            // 完成任務時 lifetime 也 +N,這裡同步
            lifetime_points_earned:
              state.wallet.lifetime_points_earned +
              result.available_points_delta,
          }
        : null,
    })),

  /**
   * 主動購買節點後同步 wallet。
   * 注意 wallet_points / pending_today_points 不變(那兩個是任務結算流,
   * 跟解鎖花費無關);只更新 unlock 相關的三個欄位。
   */
  syncWalletAfterPurchase: (result) =>
    set((state) => ({
      wallet: state.wallet
        ? {
            ...state.wallet,
            points_spent_on_unlocks: result.points_spent_on_unlocks,
            pending_today_unlock_spent: result.pending_today_unlock_spent,
          }
        : null,
    })),
}));