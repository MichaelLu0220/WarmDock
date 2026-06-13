use rusqlite::Connection;
use std::sync::{Mutex, MutexGuard};

pub struct AppState {
    db: Mutex<Connection>,
}

impl AppState {
    pub fn new(conn: Connection) -> Self {
        Self {
            db: Mutex::new(conn),
        }
    }

    /// 取得 DB 連線。
    /// poisoned mutex 直接取回連線:SQLite 連線在 panic 後仍可用,
    /// 未 commit 的 transaction 已由 Drop rollback,不會留下半套狀態。
    pub fn db(&self) -> MutexGuard<'_, Connection> {
        self.db
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}
