import { useEffect } from "react";
import { getGateways } from "../client";
import { retryReconnect, runBootstrap } from "../orchestrators/bootstrap";
import { useSessionStore } from "../stores/sessionStore";

const RECONNECT_MS = 8000;

/**
 * Fetch authoritative state on mount, then subscribe to Realtime and re-fetch on
 * any change (the desktop daily-refresh polling is retired). Pass the signed-in
 * user id; pass null while unauthenticated (e.g. demo provides its own data).
 */
export function useBootstrap(userId: string | null) {
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isReady = useSessionStore((s) => s.isReady);
  const bootstrapError = useSessionStore((s) => s.bootstrapError);

  useEffect(() => {
    let cancelled = false;
    void runBootstrap();

    // While offline, retry in the background (no loading flicker); on reconnect
    // it refreshes seamlessly and shows a transient notice.
    const reconnectTimer = window.setInterval(() => {
      if (!cancelled) void retryReconnect();
    }, RECONNECT_MS);

    if (!userId) {
      return () => {
        cancelled = true;
        window.clearInterval(reconnectTimer);
      };
    }

    const realtime = getGateways().realtime;
    const unsubscribe = realtime?.subscribe(userId, {
      onChange: () => {
        if (!cancelled) void runBootstrap();
      },
    });
    return () => {
      cancelled = true;
      window.clearInterval(reconnectTimer);
      unsubscribe?.();
    };
  }, [userId]);

  return { isBootstrapping, isReady, bootstrapError };
}
