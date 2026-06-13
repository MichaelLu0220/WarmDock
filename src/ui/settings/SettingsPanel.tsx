import { useState } from "react";
import { updateSettings } from "../../app/orchestrators/settings";
import { quitApp } from "../../app/orchestrators/windowFlow";
import { useSettingsStore } from "../../app/stores/settingsStore";
import { useUIStore } from "../../app/stores/uiStore";
import { useUnlockStore } from "../../app/stores/unlockStore";
import { t } from "../../core/i18n";
import { isRefreshTimeSettingVisible } from "../../core/rules/unlock";
import type { SettingsPatch } from "../../core/types";

const THEME_OPTIONS = [
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "system", labelKey: "settings.themeSystem" },
] as const;

const PANEL_WIDTH_OPTIONS = [
  { value: 320, labelKey: "settings.widthStandard" },
  { value: 360, labelKey: "settings.widthWide" },
] as const;

export function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const unlocks = useUnlockStore((s) => s.status);

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
    // <input type="time"> 已保證 HH:mm;空值代表使用者清空,忽略
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    void apply({ refreshTime: value });
  };

  return (
    <div className="wd-overlay" onClick={closeSettings}>
      <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="wd-modal__title">{t("settings.title")}</h2>

        <p className="wd-section-label">{t("settings.theme")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`wd-score ${
                settings.themeMode === opt.value ? "wd-score--selected" : ""
              }`}
              style={{ fontSize: 13 }}
              onClick={() => void apply({ themeMode: opt.value })}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <p className="wd-section-label">{t("settings.panelWidth")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          {PANEL_WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`wd-score ${
                settings.panelWidth === opt.value ? "wd-score--selected" : ""
              }`}
              style={{ fontSize: 13 }}
              onClick={() => void apply({ panelWidth: opt.value })}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <p className="wd-section-label">{t("settings.behavior")}</p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <button
            type="button"
            className={`wd-check ${settings.pinEnabled ? "wd-check--done" : ""}`}
            aria-label={t("settings.pinLabel")}
            onClick={() => void apply({ pinEnabled: !settings.pinEnabled })}
          />
          <span
            onClick={() => void apply({ pinEnabled: !settings.pinEnabled })}
          >
            {t("settings.pinLabel")}
          </span>
        </label>

        {isRefreshTimeSettingVisible(unlocks) && (
          <>
            <p className="wd-section-label">{t("settings.refreshTime")}</p>
            <input
              type="time"
              className="wd-input"
              value={settings.refreshTime}
              onChange={(e) => handleRefreshTimeChange(e.target.value)}
            />
          </>
        )}

        {error && (
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--wd-red)" }}>
            {t("settings.saveFailed", { message: error })}
          </p>
        )}

        <button
          type="button"
          className="wd-btn wd-btn-primary"
          style={{ marginTop: 18, width: "100%" }}
          onClick={closeSettings}
        >
          {t("settings.done")}
        </button>

        <button
          type="button"
          className="wd-btn wd-btn-quit"
          style={{ marginTop: 10, width: "100%" }}
          onClick={() => void quitApp()}
        >
          {t("settings.quit")}
        </button>
      </div>
    </div>
  );
}
