use warmdock_lib::storage;

#[test]
fn migrations_are_idempotent() {
    let conn = storage::open_in_memory().unwrap();
    // 同一連線再跑一次不會出錯也不會重複執行
    storage::migrations::run(&conn).unwrap();

    let version: i64 = conn
        .query_row("SELECT MAX(version) FROM _migrations", [], |r| r.get(0))
        .unwrap();
    assert_eq!(version, 1);
}

#[test]
fn singleton_tables_reject_second_row() {
    let conn = storage::open_in_memory().unwrap();
    assert!(conn
        .execute("INSERT INTO user_wallet (id) VALUES (2)", [])
        .is_err());
    assert!(conn
        .execute("INSERT INTO user_settings (id) VALUES (2)", [])
        .is_err());
}

#[test]
fn check_constraints_reject_invalid_rows() {
    let conn = storage::open_in_memory().unwrap();

    // 空白 title
    assert!(conn
        .execute(
            "INSERT INTO tasks (id, title, target_date, created_at, updated_at) \
             VALUES ('t1', '   ', '2026-06-12', 'n', 'n')",
            [],
        )
        .is_err());

    // 非法日期格式
    assert!(conn
        .execute(
            "INSERT INTO tasks (id, title, target_date, created_at, updated_at) \
             VALUES ('t2', 'ok', '06/12/2026', 'n', 'n')",
            [],
        )
        .is_err());

    // difficulty 超界
    assert!(conn
        .execute(
            "INSERT INTO tasks (id, title, target_date, created_at, updated_at, status, difficulty) \
             VALUES ('t3', 'ok', '2026-06-12', 'n', 'n', 'ready', 9)",
            [],
        )
        .is_err());

    // completed 但沒有 completed_at
    assert!(conn
        .execute(
            "INSERT INTO tasks (id, title, target_date, created_at, updated_at, status, difficulty) \
             VALUES ('t4', 'ok', '2026-06-12', 'n', 'n', 'completed', 3)",
            [],
        )
        .is_err());

    // 錢包負數
    assert!(conn
        .execute("UPDATE user_wallet SET wallet_points = -1 WHERE id = 1", [])
        .is_err());

    // 非法 theme
    assert!(conn
        .execute(
            "UPDATE user_settings SET theme_mode = 'neon' WHERE id = 1",
            [],
        )
        .is_err());
}

#[test]
fn tasks_date_index_exists() {
    let conn = storage::open_in_memory().unwrap();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_tasks_date_order'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(count, 1);
}
