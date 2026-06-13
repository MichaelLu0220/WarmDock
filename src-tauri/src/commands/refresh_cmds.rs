use crate::domain::clock::SystemClock;
use crate::dto::RefreshResponse;
use crate::error::AppResult;
use crate::services::refresh_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn run_daily_refresh_if_needed(state: State<'_, AppState>) -> AppResult<RefreshResponse> {
    let mut conn = state.db();
    refresh_service::run_if_needed(&mut conn, &SystemClock)
}
