import { useEffect } from "react";
import { getGateways } from "../client";
import { checkConnection, runBootstrap } from "../orchestrators/bootstrap";
import { useSessionStore } from "../stores/sessionStore";

// Backstop only — runs a network check ONLY while already offline. When online
// this fires but does nothing (a flag check, zero network/health polling).
const OFFLINE_RETRY_MS = 8000;

/**
 * Fetch authoritative state on mount, then detect connectivity changes WITHOUT
 * health polling:
 *  - Realtime socket connect/disconnect (the socket is already open — free).
 *  - Browser online/offline events.
 *  - An offline-only backstop retry (no network while online).
 * On any change it re-fetches; loss shows the read-only offline banner, recovery
 * shows a transient "back online" notice. Pass null while unauthenticated (demo).
 */
export function useBootstrap(userId: string | null) {
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isReady = useSessionStore((s) => s.isReady);
  const bootstrapError = useSessionStore((s) => s.bootstrapError);

  useEffect(() => {
    let cancelled = false;
    void runBootstrap();

    // Backstop: only does a network call while offline; a no-op when online.
    const offlineRetry = setInterval(() => {
      if (!cancelled && useSessionStore.getState().isOffline) void checkConnection();
    }, OFFLINE_RETRY_MS);

    // Browser network events (web/desktop only; React Native has no window events
    // and relies on the realtime socket signal below).
    const onWindowOffline = () => {
      if (!cancelled) useSessionStore.getState().setOffline(true);
    };
    const onWindowOnline = () => {
      if (!cancelled) void checkConnection();
    };
    const hasWindowEvents =
      typeof window !== "undefined" && typeof window.addEventListener === "function";
    if (hasWindowEvents) {
      window.addEventListener("offline", onWindowOffline);
      window.addEventListener("online", onWindowOnline);
    }

    let unsubscribe: (() => void) | undefined;
    if (userId) {
      const realtime = getGateways().realtime;
      let connected = true; // assume connected; react only to transitions
      unsubscribe = realtime?.subscribe(userId, {
        onChange: () => {
          if (!cancelled) void checkConnection(); // refetch without loading flicker
        },
        onConnectionChange: (isConnected) => {
          if (cancelled || isConnected === connected) return;
          connected = isConnected;
          void checkConnection(); // confirm via RPC: sets offline / clears + notice
        },
      });
    }

    return () => {
      cancelled = true;
      clearInterval(offlineRetry);
      if (hasWindowEvents) {
        window.removeEventListener("offline", onWindowOffline);
        window.removeEventListener("online", onWindowOnline);
      }
      unsubscribe?.();
    };
  }, [userId]);

  return { isBootstrapping, isReady, bootstrapError };
}
