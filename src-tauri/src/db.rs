use tauri::Manager;
use rusqlite::{Connection, Result};
use std::path::PathBuf;

/// 取得 DB 檔案路徑（放在 Tauri app data 目錄下）
pub fn db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    app_dir.join("warmdock.db")
}

/// 開啟 DB 連線並執行 migration
pub fn init_db(app_handle: &tauri::AppHandle) -> Result<Connection> {
    let path = db_path(app_handle);
    let conn = Connection::open(path)?;

    // 啟用 WAL 模式，提升讀寫效能
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;

    run_migrations(&conn)?;
    Ok(conn)
}

/// Migration runner（ADR-003）
fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version    INTEGER PRIMARY KEY,
            applied_at TEXT    NOT NULL
        );",
    )?;

    let migrations: Vec<(i64, &str)> = vec![
        (1, include_str!("../migrations/001_init.sql")),
    ];

    for (version, sql) in migrations {
        let already_applied: bool = conn
            .prepare("SELECT 1 FROM _migrations WHERE version = ?1")?
            .exists([version])?;

        if !already_applied {
            conn.execute_batch(sql)?;
            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (?1, datetime('now'))",
                [version],
            )?;
        }
    }

    Ok(())
}