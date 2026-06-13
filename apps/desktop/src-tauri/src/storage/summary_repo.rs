use super::rows::{summary_from_row, SUMMARY_COLS};
use crate::domain::summary::DailySummary;
use crate::error::AppResult;
use rusqlite::{params, Connection, OptionalExtension};

pub fn get(conn: &Connection, date: &str) -> AppResult<Option<DailySummary>> {
    Ok(conn
        .query_row(
            &format!("SELECT {SUMMARY_COLS} FROM daily_summary WHERE date = ?1"),
            [date],
            summary_from_row,
        )
        .optional()?)
}

/// 最近一個早於 `before` 的 summary 日期(換日判斷用)
pub fn latest_date_before(conn: &Connection, before: &str) -> AppResult<Option<String>> {
    Ok(conn
        .query_row(
            "SELECT date FROM daily_summary WHERE date < ?1 ORDER BY date DESC LIMIT 1",
            [before],
            |r| r.get(0),
        )
        .optional()?)
}

/// 最近的 summary 日期(dev 強制換日用)
pub fn latest_date(conn: &Connection) -> AppResult<Option<String>> {
    Ok(conn
        .query_row(
            "SELECT date FROM daily_summary ORDER BY date DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .optional()?)
}

pub fn upsert(conn: &Connection, s: &DailySummary) -> AppResult<()> {
    conn.execute(
        "INSERT INTO daily_summary
            (date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(date) DO UPDATE SET
            tasks_created = ?2,
            tasks_completed = ?3,
            focus_tasks_completed = ?4,
            points_earned = ?5,
            is_all_completed = ?6",
        params![
            s.date,
            s.tasks_created,
            s.tasks_completed,
            s.focus_tasks_completed,
            s.points_earned,
            s.is_all_completed as i64,
        ],
    )?;
    Ok(())
}

/// 確保某日有一筆空 summary(換日時建立今天的列)
pub fn ensure_row(conn: &Connection, date: &str) -> AppResult<()> {
    conn.execute(
        "INSERT OR IGNORE INTO daily_summary
            (date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed)
         VALUES (?1, 0, 0, 0, 0, 0)",
        [date],
    )?;
    Ok(())
}
