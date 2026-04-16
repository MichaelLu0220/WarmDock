import { create } from "zustand";
import type { UserWallet } from "../models/UserWallet";
import type { CompleteTaskResponse } from "../commands/types";

type WalletState = {
  wallet: UserWallet | null;
};

type WalletActions = {
  setWallet: (wallet: UserWallet) => void;
  syncWalletAfterCompletion: (result: CompleteTaskResponse) => void;
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
          }
        : null,
    })),
}));