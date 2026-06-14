// WarmDock desktop bridge. Authoritative task/points/streak/settlement/unlock
// logic now lives in Supabase; Rust keeps only desktop platform integration
// (window geometry today; notifications, OS credential vault and encrypted cache
// to follow).
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::window_cmds::set_window_rect,
            commands::cache_cmds::cache_write_snapshot,
            commands::cache_cmds::cache_read_snapshot,
            commands::cache_cmds::cache_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
