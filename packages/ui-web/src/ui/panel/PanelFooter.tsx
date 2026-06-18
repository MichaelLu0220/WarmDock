import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "@warmdock/app";
import { useTaskStore } from "@warmdock/app";
import { useUIStore } from "@warmdock/app";
import { useWalletStore } from "@warmdock/app";
import { pickRandomMantra, t } from "@warmdock/core/i18n";
import { formatTimeUntilRefresh } from "@warmdock/core/rules/date";

export function PanelFooter({
  chrome = "full",
}: {
  chrome?: "full" | "minimal";
}) {
  const settings = useSettingsStore((s) => s.settings);
  const tasks = useTaskStore((s) => s.tasks);
  const wallet = useWalletStore((s) => s.wallet);
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);

  // 打開 panel 時抽新的 mantra;關閉時保持不變
  // (render 期間的 guarded setState,React 文件認可的 adjust-state 模式)
  const [mantra, setMantra] = useState<string>(() => pickRandomMantra());
  const [prevOpen, setPrevOpen] = useState(isPanelOpen);
  if (isPanelOpen !== prevOpen) {
    setPrevOpen(isPanelOpen);
    if (isPanelOpen) {
      setMantra(pickRandomMantra());
    }
  }

  // 每 30 秒重算剩餘時間
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const refreshTime = settings?.refreshTime ?? "00:00";
  const timeLeft = useMemo(
    () => formatTimeUntilRefresh(refreshTime, now),
    [refreshTime, now]
  );

  // footer 只在進行中顯示(結算/慶祝時 Panel 已隱藏它),用即時 tasks 反映當下進度。
  // total 排除 draft(尚未設難度、還沒真正承諾的任務)。
  const { completed, total } = useMemo(
    () => ({
      completed: tasks.filter((task) => task.status === "completed").length,
      total: tasks.filter((task) => task.status !== "draft").length,
    }),
    [tasks]
  );

  // demo 展示用:收斂成首頁 mock 卡的 footer —— 左邊今日點數、右邊剩餘時間
  if (chrome === "minimal") {
    return (
      <div className="wd-footer wd-footer--minimal">
        <span>
          {t("footer.points", { points: wallet?.pendingTodayPoints ?? 0 })}
        </span>
        <span>{t("footer.timeLeft", { time: timeLeft })}</span>
      </div>
    );
  }

  return (
    <div className="wd-footer">
      <span>⏰ {t("footer.timeLeft", { time: timeLeft })}</span>
      <span className="wd-footer__sep">·</span>
      <span>
        <span style={{ color: "var(--wd-green)" }}>✓</span> {completed}/{total}
      </span>
      <span className="wd-footer__sep">·</span>
      <span className="wd-footer__mantra">{mantra}</span>
    </div>
  );
}
