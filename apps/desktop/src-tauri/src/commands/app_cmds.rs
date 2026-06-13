use crate::domain::clock::SystemClock;
use crate::dto::BootstrapResponse;
use crate::error::AppResult;
use crate::services::bootstrap;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn bootstrap_app(state: State<'_, AppState>) -> AppResult<BootstrapResponse> {
    let conn = state.db();
    bootstrap::bootstrap(&conn, &SystemClock)
}
