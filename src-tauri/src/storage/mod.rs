pub mod migrations;
pub mod rows;
pub mod settings_repo;
pub mod summary_repo;
pub mod task_repo;
pub mod unlock_repo;
pub mod wallet_repo;

use crate::error::AppResult;
use rusqlite::{Connection, Transaction};
use std::path::Path;

fn configure(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
}

pub fn open_db(path: &Path) -> AppResult<Connection> {
    let conn = Connection::open(path)?;
    configure(&conn)?;
    migrations::run(&conn)?;
    Ok(conn)
}

/// 測試用 in-memory DB,跑完整 migration。
pub fn open_in_memory() -> AppResult<Connection> {
    let conn = Connection::open_in_memory()?;
    configure(&conn)?;
    migrations::run(&conn)?;
    Ok(conn)
}

/// 多步寫入的唯一入口:closure 內任何錯誤都會 rollback。
pub fn with_tx<T>(
    conn: &mut Connection,
    f: impl FnOnce(&Transaction) -> AppResult<T>,
) -> AppResult<T> {
    let tx = conn.transaction()?;
    let out = f(&tx)?;
    tx.commit()?;
    Ok(out)
}
