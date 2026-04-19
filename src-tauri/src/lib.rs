mod commands;
mod unlock_catalog;
mod db;
mod models;

use db::init_db;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let conn = init_db(&app.handle())
                .expect("failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap_app,
            commands::get_today_tasks,
            commands::create_task,
            commands::set_task_detail,
            commands::complete_task,
            commands::run_daily_refresh_if_needed,
            commands::dev_force_daily_refresh,
            commands::reset_all_data,
            commands::get_unlock_status,
            commands::get_unlock_progress,
            commands::purchase_unlock,
            commands::update_user_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}