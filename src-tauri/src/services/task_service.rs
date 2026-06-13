use crate::catalog::unlock::compute_unlock_status;
use crate::domain::clock::Clock;
use crate::domain::summary::DailySummary;
use crate::domain::task::Task;
use crate::dto::CompleteTaskResponse;
use crate::error::{AppError, AppResult};
use crate::storage::{summary_repo, task_repo, unlock_repo, wallet_repo, with_tx};
use rusqlite::Connection;

pub fn create_task(conn: &mut Connection, clock: &dyn Clock, title: &str) -> AppResult<Task> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::InvalidInput("title must not be empty".into()));
    }
    let id = uuid::Uuid::new_v4().to_string();
    let date = clock.today();
    let now = clock.now();
    let title = title.to_string();

    with_tx(conn, move |tx| {
        let sort_order = task_repo::next_sort_order(tx, &date)?;
        let task = Task::new_draft(id, title, date, now, sort_order);
        task_repo::insert(tx, &task)?;
        Ok(task)
    })
}

pub fn set_task_detail(
    conn: &mut Connection,
    clock: &dyn Clock,
    task_id: &str,
    difficulty: i64,
    difficulty_suggested: Option<String>,
    is_focus: bool,
) -> AppResult<Task> {
    if let Some(s) = &difficulty_suggested {
        if !matches!(s.as_str(), "easy" | "medium" | "hard") {
            return Err(AppError::InvalidInput(format!(
                "unknown difficulty_suggested: {s}"
            )));
        }
    }
    let now = clock.now();

    with_tx(conn, move |tx| {
        let mut task = task_repo::get(tx, task_id)?;
        task.apply_detail(difficulty, difficulty_suggested, is_focus, now)?;
        task_repo::update(tx, &task)?;
        Ok(task)
    })
}

/// 完成任務:task + wallet + summary 三者在同一個 transaction 內原子更新。
pub fn complete_task(
    conn: &mut Connection,
    clock: &dyn Clock,
    task_id: &str,
) -> AppResult<CompleteTaskResponse> {
    let now = clock.now();
    let today = clock.today();

    with_tx(conn, move |tx| {
        let mut task = task_repo::get(tx, task_id)?;
        task.complete(now)?;
        task_repo::update(tx, &task)?;

        let reward = task.final_reward_points;
        let mut wallet = wallet_repo::get(tx)?;
        wallet.apply_completion(reward);
        wallet.last_completed_date = Some(today);
        wallet_repo::save(tx, &wallet)?;

        let unlocks = compute_unlock_status(&unlock_repo::unlocked_ids(tx)?);
        let tasks = task_repo::list_by_date(tx, &task.target_date)?;
        let summary =
            DailySummary::recompute(&task.target_date, &tasks, unlocks.max_visible_task_slots);
        summary_repo::upsert(tx, &summary)?;

        Ok(CompleteTaskResponse {
            reward_earned: task.base_points,
            bonus_earned: task.final_reward_points - task.base_points,
            pending_today_points: wallet.pending_today_points,
            wallet_points: wallet.wallet_points,
            all_tasks_completed: summary.is_all_completed,
            streak_days: wallet.streak_days,
            available_points_delta: reward,
            available_points_after: wallet.available_points(),
            today_summary: summary,
            task,
        })
    })
}
