import { create } from "zustand";
import type { UnlockProgress, UnlockStatus } from "@warmdock/core/types";
import { DEFAULT_UNLOCK_STATUS } from "@warmdock/core/rules/unlock";

type UnlockState = {
  /** UI 推導用(格位數、feature 開關),所有元件讀這個 */
  status: UnlockStatus;
  /** 配置器互動用,含每個節點狀態與可用點數 */
  progress: UnlockProgress | null;
  isLoading: boolean;
  error: string | null;
};

type UnlockActions = {
  setStatus: (status: UnlockStatus) => void;
  setProgress: (progress: UnlockProgress | null) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
};

export const useUnlockStore = create<UnlockState & UnlockActions>((set) => ({
  status: DEFAULT_UNLOCK_STATUS,
  progress: null,
  isLoading: false,
  error: null,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setLoading: (value) => set({ isLoading: value }),
  setError: (message) => set({ error: message }),
}));
