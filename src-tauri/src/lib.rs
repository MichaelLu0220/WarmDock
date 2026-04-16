mod commands;
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
            commands::reset_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}