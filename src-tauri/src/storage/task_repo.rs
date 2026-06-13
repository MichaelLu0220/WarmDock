use super::rows::{task_from_row, TASK_COLS};
use crate::domain::task::Task;
use crate::error::{AppError, AppResult};
use rusqlite::{params, Connection};

pub fn list_by_date(conn: &Connection, date: &str) -> AppResult<Vec<Task>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {TASK_COLS} FROM tasks WHERE target_date = ?1 ORDER BY sort_order ASC"
    ))?;
    let rows = stmt.query_map([date], task_from_row)?;
    let mut tasks = Vec::new();
    for row in rows {
        tasks.push(row?);
    }
    Ok(tasks)
}

pub fn get(conn: &Connection, id: &str) -> AppResult<Task> {
    conn.query_row(
        &format!("SELECT {TASK_COLS} FROM tasks WHERE id = ?1"),
        [id],
        task_from_row,
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::TaskNotFound,
        other => AppError::Db(other),
    })
}

pub fn next_sort_order(conn: &Connection, date: &str) -> AppResult<i64> {
    let max: i64 = conn.query_row(
        "SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE target_date = ?1",
        [date],
        |r| r.get(0),
    )?;
    Ok(max + 1)
}

pub fn insert(conn: &Connection, task: &Task) -> AppResult<()> {
    conn.execute(
        "INSERT INTO tasks (id, title, target_date, created_at, updated_at, sort_order, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            task.id,
            task.title,
            task.target_date,
            task.created_at,
            task.updated_at,
            task.sort_order,
            task.status.as_str(),
        ],
    )?;
    Ok(())
}

/// 寫回可變欄位(detail setup 與完成都走這裡)
pub fn update(conn: &Connection, task: &Task) -> AppResult<()> {
    conn.execute(
        "UPDATE tasks SET
            status = ?1,
            completed_at = ?2,
            difficulty = ?3,
            difficulty_suggested = ?4,
            base_points = ?5,
            final_reward_points = ?6,
            is_focus = ?7,
            updated_at = ?8
         WHERE id = ?9",
        params![
            task.status.as_str(),
            task.completed_at,
            task.difficulty,
            task.difficulty_suggested,
            task.base_points,
            task.final_reward_points,
            task.is_focus as i64,
            task.updated_at,
            task.id,
        ],
    )?;
    Ok(())
}

pub fn delete_by_date(conn: &Connection, date: &str) -> AppResult<()> {
    conn.execute("DELETE FROM tasks WHERE target_date = ?1", [date])?;
    Ok(())
}
