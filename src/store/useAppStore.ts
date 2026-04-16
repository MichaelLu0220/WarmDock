import { create } from "zustand";

type AppState = {
  isBootstrapping: boolean;
  isReady: boolean;
  bootstrapError: string | null;
};

type AppActions = {
  startBootstrap: () => void;
  finishBootstrap: () => void;
  failBootstrap: (error: string) => void;
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  isBootstrapping: false,
  isReady: false,
  bootstrapError: null,

  startBootstrap: () =>
    set({ isBootstrapping: true, isReady: false, bootstrapError: null }),

  finishBootstrap: () =>
    set({ isBootstrapping: false, isReady: true }),

  failBootstrap: (error: string) =>
    set({ isBootstrapping: false, isReady: false, bootstrapError: error }),
}));