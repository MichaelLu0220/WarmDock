use crate::domain::settings::{Settings, SettingsPatch};
use crate::error::AppResult;
use crate::state::AppState;
use crate::storage::settings_repo;
use tauri::State;

#[tauri::command]
pub fn update_user_settings(
    state: State<'_, AppState>,
    patch: SettingsPatch,
) -> AppResult<Settings> {
    patch.validate()?;
    let conn = state.db();
    settings_repo::apply_patch(&conn, &patch)
}

#[tauri::command]
pub fn update_trigger_position(
    state: State<'_, AppState>,
    trigger_position_y: f64,
) -> AppResult<Settings> {
    let conn = state.db();
    settings_repo::set_trigger_position(&conn, trigger_position_y)
}
