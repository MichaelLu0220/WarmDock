//! Row mapper 的唯一定義處。欄位順序與下方 *_COLS 常數一一對應,
//! 任何 SELECT 都必須用這些常數,改 struct 只需改這一檔。

use crate::domain::settings::Settings;
use crate::domain::summary::DailySummary;
use crate::domain::task::{Task, TaskStatus};
use crate::domain::wallet::Wallet;
use rusqlite::types::Type;
use rusqlite::Row;

pub const TASK_COLS: &str = "id, title, target_date, created_at, updated_at, sort_order, \
     status, completed_at, difficulty, difficulty_suggested, \
     base_points, final_reward_points, is_focus";

pub fn task_from_row(row: &Row) -> rusqlite::Result<Task> {
    let status_str: String = row.get(6)?;
    let status = TaskStatus::parse(&status_str).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            6,
            Type::Text,
            format!("unknown task status: {status_str}").into(),
        )
    })?;
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        target_date: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        sort_order: row.get(5)?,
        status,
        completed_at: row.get(7)?,
        difficulty: row.get(8)?,
        difficulty_suggested: row.get(9)?,
        base_points: row.get(10)?,
        final_reward_points: row.get(11)?,
        is_focus: row.get::<_, i64>(12)? != 0,
    })
}

pub const WALLET_COLS: &str = "wallet_points, pending_today_points, streak_days, \
     last_completed_date, last_rollover_date, best_streak_days, lifetime_points_earned, \
     points_spent_on_unlocks, pending_today_unlock_spent";

pub fn wallet_from_row(row: &Row) -> rusqlite::Result<Wallet> {
    Ok(Wallet {
        wallet_points: row.get(0)?,
        pending_today_points: row.get(1)?,
        streak_days: row.get(2)?,
        last_completed_date: row.get(3)?,
        last_rollover_date: row.get(4)?,
        best_streak_days: row.get(5)?,
        lifetime_points_earned: row.get(6)?,
        points_spent_on_unlocks: row.get(7)?,
        pending_today_unlock_spent: row.get(8)?,
    })
}

pub const SUMMARY_COLS: &str =
    "date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed";

pub fn summary_from_row(row: &Row) -> rusqlite::Result<DailySummary> {
    Ok(DailySummary {
        date: row.get(0)?,
        tasks_created: row.get(1)?,
        tasks_completed: row.get(2)?,
        focus_tasks_completed: row.get(3)?,
        points_earned: row.get(4)?,
        is_all_completed: row.get::<_, i64>(5)? != 0,
    })
}

pub const SETTINGS_COLS: &str =
    "theme_mode, panel_width, pin_enabled, refresh_time, trigger_position_y, locale";

pub fn settings_from_row(row: &Row) -> rusqlite::Result<Settings> {
    Ok(Settings {
        theme_mode: row.get(0)?,
        panel_width: row.get(1)?,
        pin_enabled: row.get::<_, i64>(2)? != 0,
        refresh_time: row.get(3)?,
        trigger_position_y: row.get(4)?,
        locale: row.get(5)?,
    })
}
