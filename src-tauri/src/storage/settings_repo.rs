use super::rows::{settings_from_row, SETTINGS_COLS};
use crate::domain::settings::{Settings, SettingsPatch};
use crate::error::AppResult;
use rusqlite::Connection;

pub fn get(conn: &Connection) -> AppResult<Settings> {
    Ok(conn.query_row(
        &format!("SELECT {SETTINGS_COLS} FROM user_settings WHERE id = 1"),
        [],
        settings_from_row,
    )?)
}

pub fn apply_patch(conn: &Connection, patch: &SettingsPatch) -> AppResult<Settings> {
    if let Some(v) = &patch.theme_mode {
        conn.execute("UPDATE user_settings SET theme_mode = ?1 WHERE id = 1", [v])?;
    }
    if let Some(v) = patch.panel_width {
        conn.execute(
            "UPDATE user_settings SET panel_width = ?1 WHERE id = 1",
            [v],
        )?;
    }
    if let Some(v) = patch.pin_enabled {
        conn.execute(
            "UPDATE user_settings SET pin_enabled = ?1 WHERE id = 1",
            [v as i64],
        )?;
    }
    if let Some(v) = &patch.refresh_time {
        conn.execute(
            "UPDATE user_settings SET refresh_time = ?1 WHERE id = 1",
            [v],
        )?;
    }
    if let Some(v) = &patch.locale {
        conn.execute("UPDATE user_settings SET locale = ?1 WHERE id = 1", [v])?;
    }
    get(conn)
}

pub fn set_trigger_position(conn: &Connection, y: f64) -> AppResult<Settings> {
    let clamped = y.clamp(0.0, 1.0);
    conn.execute(
        "UPDATE user_settings SET trigger_position_y = ?1 WHERE id = 1",
        [clamped],
    )?;
    get(conn)
}
