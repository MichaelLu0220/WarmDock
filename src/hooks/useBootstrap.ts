import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useTaskStore } from "../store/useTaskStore";
import { useWalletStore } from "../store/useWalletStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useSummaryStore } from "../store/useSummaryStore";
import { useUIStore } from "../store/useUIStore";
import { bootstrapApp } from "../commands/invoke";
import { initWindowAnchor } from "../lib/windowMode";

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
  const setUnlocks = useUIStore((s) => s.setUnlocks);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      startBootstrap();
      try {
        // 記錄 app 啟動時的視窗右緣,之後所有 resize 都以此為錨點
        await initWindowAnchor();

        const data = await bootstrapApp();
        if (cancelled) return;

        setTasks(data.tasks);
        setWallet(data.wallet);
        setSettings(data.settings);
        if (data.summary) setSummary(data.summary);
        setUnlocks(data.unlocks);

        const allSetup = data.tasks.filter((t) => t.setup_completed);
        if (
          allSetup.length >= data.unlocks.max_visible_task_slots &&
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
    return () => {
      cancelled = true;
    };
  }, []);

  return { isBootstrapping, isReady, bootstrapError };
}