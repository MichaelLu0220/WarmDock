-- tasks
CREATE TABLE IF NOT EXISTS tasks (
    id                          TEXT PRIMARY KEY,
    title                       TEXT NOT NULL,
    target_date                 TEXT NOT NULL,
    created_at                  TEXT NOT NULL,
    updated_at                  TEXT NOT NULL,
    sort_order                  INTEGER NOT NULL DEFAULT 0,
    completed                   INTEGER NOT NULL DEFAULT 0,
    setup_completed             INTEGER NOT NULL DEFAULT 0,
    completed_at                TEXT,
    difficulty_selected         INTEGER,
    difficulty_suggested        TEXT,
    base_points                 INTEGER NOT NULL DEFAULT 0,
    final_reward_points         INTEGER NOT NULL DEFAULT 0,
    is_focus_task               INTEGER NOT NULL DEFAULT 0,
    focus_mark_opportunity_used INTEGER NOT NULL DEFAULT 0
);

-- user_settings (single row, id = 1)
CREATE TABLE IF NOT EXISTS user_settings (
    id                 INTEGER PRIMARY KEY DEFAULT 1,
    theme_mode         TEXT    NOT NULL DEFAULT 'light',
    panel_width        INTEGER NOT NULL DEFAULT 320,
    pin_enabled        INTEGER NOT NULL DEFAULT 0,
    refresh_time       TEXT    NOT NULL DEFAULT '00:00',
    trigger_position_y REAL    NOT NULL DEFAULT 0.5
);

-- user_wallet (single row, id = 1)
CREATE TABLE IF NOT EXISTS user_wallet (
    id                   INTEGER PRIMARY KEY DEFAULT 1,
    wallet_points        INTEGER NOT NULL DEFAULT 0,
    pending_today_points INTEGER NOT NULL DEFAULT 0,
    streak_days          INTEGER NOT NULL DEFAULT 0,
    last_completed_date  TEXT,
    best_streak_days     INTEGER NOT NULL DEFAULT 0
);

-- daily_summary
CREATE TABLE IF NOT EXISTS daily_summary (
    date                   TEXT PRIMARY KEY,
    tasks_created          INTEGER NOT NULL DEFAULT 0,
    tasks_completed        INTEGER NOT NULL DEFAULT 0,
    focus_tasks_completed  INTEGER NOT NULL DEFAULT 0,
    points_earned          INTEGER NOT NULL DEFAULT 0,
    is_all_completed       INTEGER NOT NULL DEFAULT 0
);

-- 預設資料：確保 settings 和 wallet 各有一筆
INSERT OR IGNORE INTO user_settings (id) VALUES (1);
INSERT OR IGNORE INTO user_wallet (id) VALUES (1);