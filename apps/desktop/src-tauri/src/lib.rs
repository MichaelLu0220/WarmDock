// WarmDock desktop bridge. Authoritative task/points/streak/settlement/unlock
// logic now lives in Supabase; Rust keeps only desktop platform integration
// (window geometry today; notifications, OS credential vault and encrypted cache
// to follow).
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::window_cmds::set_window_rect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
