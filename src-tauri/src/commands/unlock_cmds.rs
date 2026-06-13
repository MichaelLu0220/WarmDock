use crate::domain::clock::SystemClock;
use crate::dto::{PurchaseUnlockResponse, UnlockProgressResponse};
use crate::error::AppResult;
use crate::services::unlock_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_unlock_progress(state: State<'_, AppState>) -> AppResult<UnlockProgressResponse> {
    let conn = state.db();
    unlock_service::progress(&conn)
}

#[tauri::command]
pub fn purchase_unlock(
    state: State<'_, AppState>,
    node_id: String,
) -> AppResult<PurchaseUnlockResponse> {
    let mut conn = state.db();
    unlock_service::purchase(&mut conn, &SystemClock, &node_id)
}
