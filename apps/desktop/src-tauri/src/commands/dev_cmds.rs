//! 開發專用命令。整個模組只在 debug build 編譯與註冊,
//! release build 中這些 command 不存在(invoke 會直接失敗)。

use crate::domain::clock::SystemClock;
use crate::dto::RefreshResponse;
use crate::error::AppResult;
use crate::services::refresh_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn dev_force_daily_refresh(state: State<'_, AppState>) -> AppResult<RefreshResponse> {
    let mut conn = state.db();
    refresh_service::force_refresh(&mut conn, &SystemClock)
}

#[tauri::command]
pub fn dev_reset_all_data(state: State<'_, AppState>) -> AppResult<String> {
    let conn = state.db();
    conn.execute_batch(
        "DELETE FROM tasks;
         DELETE FROM daily_summary;
         DELETE FROM unlock_nodes;
         UPDATE user_wallet SET
             wallet_points = 0,
             pending_today_points = 0,
             pending_today_unlock_spent = 0,
             streak_days = 0,
             last_completed_date = NULL,
             best_streak_days = 0,
             lifetime_points_earned = 0,
             points_spent_on_unlocks = 0
         WHERE id = 1;
         UPDATE user_settings SET
             theme_mode = 'light',
             panel_width = 320,
             pin_enabled = 0,
             refresh_time = '00:00',
             trigger_position_y = 0.5,
             locale = 'zh-TW'
         WHERE id = 1;",
    )
    .map_err(crate::error::AppError::Db)?;
    Ok("all data reset".to_string())
}
