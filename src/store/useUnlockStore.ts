import { create } from "zustand";
import type {
  UnlockProgressResponse,
  PurchaseUnlockResponse,
} from "../commands/types";
import {
  fetchUnlockProgress,
  purchaseUnlockNode,
} from "../services/rewardService";

type UnlockState = {
  progress: UnlockProgressResponse | null;
  isLoading: boolean;
  error: string | null;
};

type UnlockActions = {
  loadProgress: () => Promise<void>;
  purchase: (nodeId: string) => Promise<PurchaseUnlockResponse>;
  clear: () => void;
};

/**
 * Unlock 系統專用 store。
 *
 * 與 useUIStore.unlocks (UnlockStatus) 分工:
 * - useUIStore.unlocks = 給 UI 推導 (例如 max_visible_task_slots),所有元件讀取用
 * - useUnlockStore.progress = 配置器互動用,含每個節點的狀態、可用點數
 *
 * purchase 成功後,這個 store 負責更新自己的 progress,
 * 呼叫端(例如配置器畫面)還要自己同步 useUIStore.setUnlocks()
 * 以及 useWalletStore 的 pending_today_unlock_spent。
 */
export const useUnlockStore = create<UnlockState & UnlockActions>((set) => ({
  progress: null,
  isLoading: false,
  error: null,

  loadProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const progress = await fetchUnlockProgress();
      set({ progress });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  purchase: async (nodeId: string) => {
    set({ error: null });
    try {
      const result = await purchaseUnlockNode(nodeId);
      // 購買後重新拉一次 progress,確保所有節點的 affordable / requirements_met 都刷新
      const progress = await fetchUnlockProgress();
      set({ progress });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
      throw err;
    }
  },

  clear: () => set({ progress: null, error: null }),
}));