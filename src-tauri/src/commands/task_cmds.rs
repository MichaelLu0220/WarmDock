use crate::domain::clock::{Clock, SystemClock};
use crate::domain::task::Task;
use crate::dto::CompleteTaskResponse;
use crate::error::AppResult;
use crate::services::task_service;
use crate::state::AppState;
use crate::storage::task_repo;
use tauri::State;

#[tauri::command]
pub fn get_today_tasks(
    state: State<'_, AppState>,
    target_date: Option<String>,
) -> AppResult<Vec<Task>> {
    let conn = state.db();
    let date = target_date.unwrap_or_else(|| SystemClock.today());
    task_repo::list_by_date(&conn, &date)
}

#[tauri::command]
pub fn create_task(state: State<'_, AppState>, title: String) -> AppResult<Task> {
    let mut conn = state.db();
    task_service::create_task(&mut conn, &SystemClock, &title)
}

#[tauri::command]
pub fn set_task_detail(
    state: State<'_, AppState>,
    task_id: String,
    difficulty_suggested: Option<String>,
    difficulty_selected: i64,
    is_focus_task: Option<bool>,
) -> AppResult<Task> {
    let mut conn = state.db();
    task_service::set_task_detail(
        &mut conn,
        &SystemClock,
        &task_id,
        difficulty_selected,
        difficulty_suggested,
        is_focus_task.unwrap_or(false),
    )
}

#[tauri::command]
pub fn complete_task(
    state: State<'_, AppState>,
    task_id: String,
) -> AppResult<CompleteTaskResponse> {
    let mut conn = state.db();
    task_service::complete_task(&mut conn, &SystemClock, &task_id)
}
