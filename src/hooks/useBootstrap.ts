import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useTaskStore } from "../store/useTaskStore";
import { useWalletStore } from "../store/useWalletStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useSummaryStore } from "../store/useSummaryStore";
import { useUIStore } from "../store/useUIStore";
import { bootstrapApp } from "../commands/invoke";

export function useBootstrap() {
  const { isBootstrapping, isReady, bootstrapError } = useAppStore();
  const startBootstrap = useAppStore((s) => s.startBootstrap);
  const finishBootstrap = useAppStore((s) => s.finishBootstrap);
  const failBootstrap = useAppStore((s) => s.failBootstrap);

  const setTasks = useTaskStore((s) => s.setTasks);
  const setWallet = useWalletStore((s) => s.setWallet);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const setSummary = useSummaryStore((s) => s.setSummary);
  const setAllTasksCompleted = useUIStore((s) => s.setAllTasksCompleted);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      startBootstrap();
      try {
        const data = await bootstrapApp();
        if (cancelled) return;

        setTasks(data.tasks);
        setWallet(data.wallet);
        setSettings(data.settings);
        if (data.summary) setSummary(data.summary);

        // 若 bootstrap 時已是全部完成狀態（重開 app）
        const allSetup = data.tasks.filter((t) => t.setup_completed);
        if (
          allSetup.length === 3 &&
          allSetup.every((t) => t.completed)
        ) {
          setAllTasksCompleted(true);
        }

        finishBootstrap();
      } catch (err) {
        if (!cancelled) {
          failBootstrap(err instanceof Error ? err.message : String(err));
        }
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  return { isBootstrapping, isReady, bootstrapError };
}