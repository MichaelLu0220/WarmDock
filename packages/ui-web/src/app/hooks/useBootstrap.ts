import { useEffect } from "react";
import { getGateways } from "../client";
import { runBootstrap } from "../orchestrators/bootstrap";
import { useSessionStore } from "../stores/sessionStore";

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

    if (!userId) return;
    const realtime = getGateways().realtime;
    if (!realtime) return;

    const unsubscribe = realtime.subscribe(userId, {
      onChange: () => {
        if (!cancelled) void runBootstrap();
      },
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);

  return { isBootstrapping, isReady, bootstrapError };
}
