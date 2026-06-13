use rusqlite::Connection;

const MIGRATIONS: &[(i64, &str)] = &[(1, include_str!("../../migrations/001_init.sql"))];

/// Migration runner(ADR-003 的強化版):
/// 每份 migration 連同版本記錄包在同一個 transaction,
/// 失敗整份 rollback,不會留下「跑了一半但已記版本」的狀態。
pub fn run(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version    INTEGER PRIMARY KEY,
            applied_at TEXT    NOT NULL
        );",
    )?;

    for (version, sql) in MIGRATIONS {
        let already_applied: bool = conn
            .prepare("SELECT 1 FROM _migrations WHERE version = ?1")?
            .exists([version])?;
        if already_applied {
            continue;
        }

        conn.execute_batch("BEGIN")?;
        let result = conn.execute_batch(sql).and_then(|_| {
            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (?1, datetime('now'))",
                [version],
            )
            .map(|_| ())
        });
        match result {
            Ok(()) => conn.execute_batch("COMMIT")?,
            Err(e) => {
                let _ = conn.execute_batch("ROLLBACK");
                return Err(e);
            }
        }
    }

    Ok(())
}
