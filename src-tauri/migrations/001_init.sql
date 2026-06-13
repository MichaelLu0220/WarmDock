-- WarmDock schema v2 — 全面重寫版(本機資料砍掉重來,單一 migration 起步)

-- tasks:status 三態取代 completed/setup_completed 雙布林
CREATE TABLE tasks (
    id                   TEXT PRIMARY KEY,
    title                TEXT NOT NULL CHECK (length(trim(title)) > 0),
    target_date          TEXT NOT NULL
                             CHECK (target_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL,
    sort_order           INTEGER NOT NULL DEFAULT 0,
    status               TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'ready', 'completed')),
    completed_at         TEXT,
    difficulty           INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    difficulty_suggested TEXT CHECK (difficulty_suggested IN ('easy', 'medium', 'hard')),
    base_points          INTEGER NOT NULL DEFAULT 0 CHECK (base_points >= 0),
    final_reward_points  INTEGER NOT NULL DEFAULT 0 CHECK (final_reward_points >= base_points),
    is_focus             INTEGER NOT NULL DEFAULT 0 CHECK (is_focus IN (0, 1)),
    CHECK (status != 'completed' OR completed_at IS NOT NULL),
    CHECK (status = 'draft' OR difficulty IS NOT NULL)
);
CREATE INDEX idx_tasks_date_order ON tasks (target_date, sort_order);

-- 單例表:CHECK (id = 1) 防多列
CREATE TABLE user_wallet (
    id                         INTEGER PRIMARY KEY CHECK (id = 1),
    wallet_points              INTEGER NOT NULL DEFAULT 0 CHECK (wallet_points >= 0),
    pending_today_points       INTEGER NOT NULL DEFAULT 0 CHECK (pending_today_points >= 0),
    pending_today_unlock_spent INTEGER NOT NULL DEFAULT 0 CHECK (pending_today_unlock_spent >= 0),
    streak_days                INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
    best_streak_days           INTEGER NOT NULL DEFAULT 0 CHECK (best_streak_days >= streak_days),
    last_completed_date        TEXT,
    last_rollover_date         TEXT,
    lifetime_points_earned     INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points_earned >= 0),
    points_spent_on_unlocks    INTEGER NOT NULL DEFAULT 0 CHECK (points_spent_on_unlocks >= 0)
);

CREATE TABLE user_settings (
    id                 INTEGER PRIMARY KEY CHECK (id = 1),
    theme_mode         TEXT NOT NULL DEFAULT 'light'
                           CHECK (theme_mode IN ('light', 'dark', 'system')),
    panel_width        INTEGER NOT NULL DEFAULT 320 CHECK (panel_width BETWEEN 280 AND 480),
    pin_enabled        INTEGER NOT NULL DEFAULT 0 CHECK (pin_enabled IN (0, 1)),
    refresh_time       TEXT NOT NULL DEFAULT '00:00'
                           CHECK (refresh_time GLOB '[0-2][0-9]:[0-5][0-9]'),
    trigger_position_y REAL NOT NULL DEFAULT 0.5
                           CHECK (trigger_position_y BETWEEN 0.0 AND 1.0),
    locale             TEXT NOT NULL DEFAULT 'zh-TW'
);

CREATE TABLE daily_summary (
    date                  TEXT PRIMARY KEY
                              CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    tasks_created         INTEGER NOT NULL DEFAULT 0 CHECK (tasks_created >= 0),
    tasks_completed       INTEGER NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
    focus_tasks_completed INTEGER NOT NULL DEFAULT 0 CHECK (focus_tasks_completed >= 0),
    points_earned         INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    is_all_completed      INTEGER NOT NULL DEFAULT 0 CHECK (is_all_completed IN (0, 1))
);

CREATE TABLE unlock_nodes (
    node_id     TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL
);

INSERT INTO user_wallet (id) VALUES (1);
INSERT INTO user_settings (id) VALUES (1);
