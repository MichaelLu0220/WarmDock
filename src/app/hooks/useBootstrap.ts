import { useEffect } from "react";
import { runBootstrap } from "../orchestrators/bootstrap";
import { useSessionStore } from "../stores/sessionStore";

export function useBootstrap() {
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isReady = useSessionStore((s) => s.isReady);
  const bootstrapError = useSessionStore((s) => s.bootstrapError);

  useEffect(() => {
    void runBootstrap();
  }, []);

  return { isBootstrapping, isReady, bootstrapError };
}
