import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useTaskStore } from "../store/useTaskStore";

export function useBootstrap() {
  const { isBootstrapping, isReady, bootstrapError } = useAppStore();
  const startBootstrap = useAppStore((s) => s.startBootstrap);
  const finishBootstrap = useAppStore((s) => s.finishBootstrap);
  const failBootstrap = useAppStore((s) => s.failBootstrap);
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      startBootstrap();
      try {
        await loadTodayTasks();
        if (!cancelled) finishBootstrap();
      } catch (err) {
        if (!cancelled) {
          failBootstrap(err instanceof Error ? err.message : String(err));
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isBootstrapping, isReady, bootstrapError };
}