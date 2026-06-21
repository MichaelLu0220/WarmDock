import { useState } from "react";
import {
  getAuthActions,
  updateSettings,
  useSettingsStore,
  useUnlockStore,
} from "@warmdock/app";
import { t } from "@warmdock/core/i18n";
import { isRefreshTimeSettingVisible } from "@warmdock/core/rules/unlock";
import type { SettingsPatch } from "@warmdock/core/types";

const THEME_OPTIONS = [
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "system", labelKey: "settings.themeSystem" },
] as const;

/**
 * 設定頁(書本第 3 頁,web)。沿用 SettingsPanel 的存檔邏輯,但改成「頁」而非
 * modal:沒有 Done 按鈕(翻頁離開即可),也不含桌面浮窗專屬項(面板寬度 /
 * 失焦自動收合 / 結束 app)。只留:主題、(解鎖後)刷新時間、登出。
 * SettingsPanel 仍給桌面 full 用。
 */
export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const unlocks = useUnlockStore((s) => s.status);
  const auth = getAuthActions();

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!settings) return null;

  const apply = async (patch: SettingsPatch) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateSettings(patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshTimeChange = (value: string) => {
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    void apply({ refreshTime: value });
  };

  return (
    <div className="wd-panel__body wd-settings">
      <div className="wd-settings__head">
        <span className="wd-settings__title">⚙︎ {t("settings.title")}</span>
      </div>

      <section className="wd-settings__group">
        <p className="wd-section-label">{t("settings.theme")}</p>
        <div className="wd-settings__choices">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`wd-score ${
                settings.themeMode === opt.value ? "wd-score--selected" : ""
              }`}
              onClick={() => void apply({ themeMode: opt.value })}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </section>

      {isRefreshTimeSettingVisible(unlocks) && (
        <section className="wd-settings__group">
          <p className="wd-section-label">{t("settings.refreshTime")}</p>
          <input
            type="time"
            className="wd-input"
            value={settings.refreshTime}
            onChange={(e) => handleRefreshTimeChange(e.target.value)}
          />
        </section>
      )}

      {error && (
        <p className="wd-settings__error">
          {t("settings.saveFailed", { message: error })}
        </p>
      )}

      {auth && (
        <button
          type="button"
          className="wd-btn"
          style={{ marginTop: "auto" }}
          onClick={() => void auth.signOut()}
        >
          {t("account.signOut")}
        </button>
      )}
    </div>
  );
}
