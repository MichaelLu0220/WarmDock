pub mod catalog;
pub mod commands;
pub mod domain;
pub mod dto;
pub mod error;
pub mod services;
pub mod state;
pub mod storage;

use state::AppState;
use std::path::PathBuf;
use tauri::Manager;

fn db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    app_dir.join("warmdock.db")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .setup(|app| {
            let conn =
                storage::open_db(&db_path(app.handle())).expect("failed to initialize database");
            app.manage(AppState::new(conn));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init());

    // dev commands 只在 debug build 註冊;兩份清單刻意重複,
    // 因為 generate_handler! 無法在巨集內做 cfg 分支
    #[cfg(debug_assertions)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::app_cmds::bootstrap_app,
        commands::task_cmds::get_today_tasks,
        commands::task_cmds::create_task,
        commands::task_cmds::set_task_detail,
        commands::task_cmds::complete_task,
        commands::refresh_cmds::run_daily_refresh_if_needed,
        commands::unlock_cmds::get_unlock_progress,
        commands::unlock_cmds::purchase_unlock,
        commands::settings_cmds::update_user_settings,
        commands::settings_cmds::update_trigger_position,
        commands::window_cmds::set_window_rect,
        commands::dev_cmds::dev_force_daily_refresh,
        commands::dev_cmds::dev_reset_all_data,
    ]);
    #[cfg(not(debug_assertions))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::app_cmds::bootstrap_app,
        commands::task_cmds::get_today_tasks,
        commands::task_cmds::create_task,
        commands::task_cmds::set_task_detail,
        commands::task_cmds::complete_task,
        commands::refresh_cmds::run_daily_refresh_if_needed,
        commands::unlock_cmds::get_unlock_progress,
        commands::unlock_cmds::purchase_unlock,
        commands::settings_cmds::update_user_settings,
        commands::settings_cmds::update_trigger_position,
        commands::window_cmds::set_window_rect,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
