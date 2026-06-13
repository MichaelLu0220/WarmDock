use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct Settings {
    pub theme_mode: String,
    pub panel_width: i64,
    pub pin_enabled: bool,
    pub refresh_time: String,
    pub trigger_position_y: f64,
    pub locale: String,
}

/// patch 式更新:有送的欄位才改
#[derive(Debug, Default, Deserialize)]
pub struct SettingsPatch {
    pub theme_mode: Option<String>,
    pub panel_width: Option<i64>,
    pub pin_enabled: Option<bool>,
    pub refresh_time: Option<String>,
    pub locale: Option<String>,
}

impl SettingsPatch {
    /// 先在應用層驗證,讓錯誤是結構化的 INVALID_INPUT 而不是 DB CHECK 失敗
    pub fn validate(&self) -> AppResult<()> {
        if let Some(theme) = &self.theme_mode {
            if !matches!(theme.as_str(), "light" | "dark" | "system") {
                return Err(AppError::InvalidInput(format!(
                    "unknown theme_mode: {theme}"
                )));
            }
        }
        if let Some(w) = self.panel_width {
            if !(280..=480).contains(&w) {
                return Err(AppError::InvalidInput(format!(
                    "panel_width must be 280..=480, got {w}"
                )));
            }
        }
        if let Some(t) = &self.refresh_time {
            let valid = t.len() == 5
                && t.as_bytes()[2] == b':'
                && t[0..2].parse::<u32>().map(|h| h < 24).unwrap_or(false)
                && t[3..5].parse::<u32>().map(|m| m < 60).unwrap_or(false);
            if !valid {
                return Err(AppError::InvalidInput(format!(
                    "refresh_time must be HH:mm, got {t}"
                )));
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn patch_validation() {
        let ok = SettingsPatch {
            theme_mode: Some("dark".into()),
            panel_width: Some(360),
            refresh_time: Some("04:30".into()),
            ..Default::default()
        };
        assert!(ok.validate().is_ok());

        assert!(SettingsPatch {
            theme_mode: Some("neon".into()),
            ..Default::default()
        }
        .validate()
        .is_err());
        assert!(SettingsPatch {
            panel_width: Some(100),
            ..Default::default()
        }
        .validate()
        .is_err());
        assert!(SettingsPatch {
            refresh_time: Some("25:00".into()),
            ..Default::default()
        }
        .validate()
        .is_err());
        assert!(SettingsPatch {
            refresh_time: Some("0430".into()),
            ..Default::default()
        }
        .validate()
        .is_err());
    }
}
