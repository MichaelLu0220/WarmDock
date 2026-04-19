use tauri::State;
use crate::AppState;
use crate::models::*;
use crate::unlock_catalog::{UNLOCK_CATALOG, compute_unlock_status, find_node};
use std::collections::HashSet;

/// 格式化錯誤為字串（Tauri command 的 Err 必須是 String）
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

/// 取得今天日期 YYYY-MM-DD
fn today_str() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}

/// 讀取所有已解鎖節點 ID。
fn load_unlocked_node_ids(db: &rusqlite::Connection) -> Result<HashSet<String>, String> {
    let mut stmt = db
        .prepare("SELECT node_id FROM unlock_nodes")
        .map_err(err)?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(err)?;
    let mut set = HashSet::new();
    for row in rows {
        set.insert(row.map_err(err)?);
    }
    Ok(set)
}

/// 讀目前可用點數 = wallet_points + pending_today_points - pending_today_unlock_spent
/// 回傳 (available, lifetime, spent) — lifetime / spent 保留作歷史統計用
fn load_available_points(db: &rusqlite::Connection) -> Result<(i64, i64, i64), String> {
    db.query_row(
        "SELECT wallet_points, pending_today_points, pending_today_unlock_spent,
                lifetime_points_earned, points_spent_on_unlocks
         FROM user_wallet WHERE id = 1",
        [],
        |row| {
            let wallet: i64 = row.get(0)?;
            let pending: i64 = row.get(1)?;
            let today_spent: i64 = row.get(2)?;
            let lifetime: i64 = row.get(3)?;
            let spent: i64 = row.get(4)?;
            let available = wallet + pending - today_spent;
            Ok((available, lifetime, spent))
        },
    )
    .map_err(err)
}

// ─── get_today_tasks ───

#[tauri::command]
pub fn get_today_tasks(
    state: State<'_, AppState>,
    target_date: Option<String>,
) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(err)?;
    let date = target_date.unwrap_or_else(today_str);

    let mut stmt = db
        .prepare(
            "SELECT id, title, target_date, created_at, updated_at, sort_order,
                    completed, setup_completed, completed_at,
                    difficulty_selected, difficulty_suggested,
                    base_points, final_reward_points,
                    is_focus_task, focus_mark_opportunity_used
             FROM tasks
             WHERE target_date = ?1
             ORDER BY sort_order ASC",
        )
        .map_err(err)?;

    let rows = stmt
        .query_map([&date], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                target_date: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                sort_order: row.get(5)?,
                completed: row.get::<_, i64>(6)? != 0,
                setup_completed: row.get::<_, i64>(7)? != 0,
                completed_at: row.get(8)?,
                difficulty_selected: row.get(9)?,
                difficulty_suggested: row.get(10)?,
                base_points: row.get(11)?,
                final_reward_points: row.get(12)?,
                is_focus_task: row.get::<_, i64>(13)? != 0,
                focus_mark_opportunity_used: row.get::<_, i64>(14)? != 0,
            })
        })
        .map_err(err)?;

    let mut tasks = Vec::new();
    for row in rows {
        tasks.push(row.map_err(err)?);
    }
    Ok(tasks)
}

// ─── create_task ───

#[tauri::command]
pub fn create_task(
    state: State<'_, AppState>,
    title: String,
) -> Result<Task, String> {
    let db = state.db.lock().map_err(err)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Local::now().to_rfc3339();
    let date = today_str();

    let max_order: i64 = db
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE target_date = ?1",
            [&date],
            |row| row.get(0),
        )
        .map_err(err)?;
    let sort_order = max_order + 1;

    db.execute(
        "INSERT INTO tasks (id, title, target_date, created_at, updated_at, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![id, title, date, now, now, sort_order],
    )
    .map_err(err)?;

    let task = Task {
        id,
        title,
        target_date: date,
        created_at: now.clone(),
        updated_at: now,
        sort_order,
        completed: false,
        setup_completed: false,
        completed_at: None,
        difficulty_selected: None,
        difficulty_suggested: None,
        base_points: 0,
        final_reward_points: 0,
        is_focus_task: false,
        focus_mark_opportunity_used: false,
    };

    Ok(task)
}

// ─── set_task_detail ───

#[tauri::command]
pub fn set_task_detail(
    state: State<'_, AppState>,
    task_id: String,
    difficulty_suggested: Option<String>,
    difficulty_selected: i32,
    is_focus_task: Option<bool>,
) -> Result<Task, String> {
    let db = state.db.lock().map_err(err)?;
    let now = chrono::Local::now().to_rfc3339();
    let focus = is_focus_task.unwrap_or(false);

    let base_points = difficulty_selected as i64;
    let final_reward_points = if focus {
        base_points + 1
    } else {
        base_points
    };

    db.execute(
        "UPDATE tasks
         SET difficulty_suggested = ?1,
             difficulty_selected  = ?2,
             is_focus_task        = ?3,
             focus_mark_opportunity_used = 1,
             setup_completed      = 1,
             base_points          = ?4,
             final_reward_points  = ?5,
             updated_at           = ?6
         WHERE id = ?7",
        rusqlite::params![
            difficulty_suggested,
            difficulty_selected,
            focus as i64,
            base_points,
            final_reward_points,
            now,
            task_id,
        ],
    )
    .map_err(err)?;

    let task = db
        .query_row(
            "SELECT id, title, target_date, created_at, updated_at, sort_order,
                    completed, setup_completed, completed_at,
                    difficulty_selected, difficulty_suggested,
                    base_points, final_reward_points,
                    is_focus_task, focus_mark_opportunity_used
             FROM tasks WHERE id = ?1",
            [&task_id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    target_date: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                    sort_order: row.get(5)?,
                    completed: row.get::<_, i64>(6)? != 0,
                    setup_completed: row.get::<_, i64>(7)? != 0,
                    completed_at: row.get(8)?,
                    difficulty_selected: row.get(9)?,
                    difficulty_suggested: row.get(10)?,
                    base_points: row.get(11)?,
                    final_reward_points: row.get(12)?,
                    is_focus_task: row.get::<_, i64>(13)? != 0,
                    focus_mark_opportunity_used: row.get::<_, i64>(14)? != 0,
                })
            },
        )
        .map_err(err)?;

    Ok(task)
}

// ─── bootstrap_app ───

#[tauri::command]
pub fn bootstrap_app(
    state: State<'_, AppState>,
) -> Result<BootstrapAppResponse, String> {
    let db = state.db.lock().map_err(err)?;
    let today = today_str();

    let mut stmt = db
        .prepare(
            "SELECT id, title, target_date, created_at, updated_at, sort_order,
                    completed, setup_completed, completed_at,
                    difficulty_selected, difficulty_suggested,
                    base_points, final_reward_points,
                    is_focus_task, focus_mark_opportunity_used
             FROM tasks
             WHERE target_date = ?1
             ORDER BY sort_order ASC",
        )
        .map_err(err)?;

    let task_rows = stmt
        .query_map([&today], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                target_date: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                sort_order: row.get(5)?,
                completed: row.get::<_, i64>(6)? != 0,
                setup_completed: row.get::<_, i64>(7)? != 0,
                completed_at: row.get(8)?,
                difficulty_selected: row.get(9)?,
                difficulty_suggested: row.get(10)?,
                base_points: row.get(11)?,
                final_reward_points: row.get(12)?,
                is_focus_task: row.get::<_, i64>(13)? != 0,
                focus_mark_opportunity_used: row.get::<_, i64>(14)? != 0,
            })
        })
        .map_err(err)?;

    let mut tasks = Vec::new();
    for row in task_rows {
        tasks.push(row.map_err(err)?);
    }
    drop(stmt);

    let wallet = db
        .query_row(
            "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days,
                    lifetime_points_earned, points_spent_on_unlocks, pending_today_unlock_spent
             FROM user_wallet WHERE id = 1",
            [],
            |row| Ok(UserWallet {
                wallet_points: row.get(0)?,
                pending_today_points: row.get(1)?,
                streak_days: row.get(2)?,
                last_completed_date: row.get(3)?,
                best_streak_days: row.get(4)?,
                lifetime_points_earned: row.get(5)?,
                points_spent_on_unlocks: row.get(6)?,
                pending_today_unlock_spent: row.get(7)?,
            }),
        )
        .map_err(err)?;

    let settings = db
        .query_row(
            "SELECT theme_mode, panel_width, pin_enabled, refresh_time, trigger_position_y
             FROM user_settings WHERE id = 1",
            [],
            |row| Ok(UserSettings {
                theme_mode: row.get(0)?,
                panel_width: row.get(1)?,
                pin_enabled: row.get::<_, i64>(2)? != 0,
                refresh_time: row.get(3)?,
                trigger_position_y: row.get(4)?,
            }),
        )
        .map_err(err)?;

    let summary = db
        .query_row(
            "SELECT date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed
             FROM daily_summary WHERE date = ?1",
            [&today],
            |row| Ok(DailySummary {
                date: row.get(0)?,
                tasks_created: row.get(1)?,
                tasks_completed: row.get(2)?,
                focus_tasks_completed: row.get(3)?,
                points_earned: row.get(4)?,
                is_all_completed: row.get::<_, i64>(5)? != 0,
            }),
        )
        .ok();

    let unlocked_ids = load_unlocked_node_ids(&db)?;
    let unlocks = compute_unlock_status(&unlocked_ids);

    Ok(BootstrapAppResponse {
        today,
        tasks,
        wallet,
        settings,
        summary,
        unlocks,
        refresh_applied: false,
    })
}

// ─── reset_all_data (dev only) ───

#[tauri::command]
pub fn reset_all_data(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(err)?;
    db.execute_batch(
        "DELETE FROM tasks;
         DELETE FROM daily_summary;
         DELETE FROM unlock_nodes;
         UPDATE user_wallet SET
             wallet_points = 0,
             pending_today_points = 0,
             streak_days = 0,
             last_completed_date = NULL,
             best_streak_days = 0,
             lifetime_points_earned = 0,
             points_spent_on_unlocks = 0,
             pending_today_unlock_spent = 0
         WHERE id = 1;
         UPDATE user_settings SET
             theme_mode = 'light',
             panel_width = 320,
             pin_enabled = 0,
             refresh_time = '00:00',
             trigger_position_y = 0.5
         WHERE id = 1;",
    )
    .map_err(err)?;
    Ok("all data reset".to_string())
}

// ─── complete_task ───

#[tauri::command]
pub fn complete_task(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<CompleteTaskResponse, String> {
    let db = state.db.lock().map_err(err)?;
    let now = chrono::Local::now().to_rfc3339();
    let today = today_str();

    let task_row = db.query_row(
        "SELECT id, title, target_date, created_at, updated_at, sort_order,
                completed, setup_completed, completed_at,
                difficulty_selected, difficulty_suggested,
                base_points, final_reward_points,
                is_focus_task, focus_mark_opportunity_used
         FROM tasks WHERE id = ?1",
        [&task_id],
        |row| Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            target_date: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            sort_order: row.get(5)?,
            completed: row.get::<_, i64>(6)? != 0,
            setup_completed: row.get::<_, i64>(7)? != 0,
            completed_at: row.get(8)?,
            difficulty_selected: row.get(9)?,
            difficulty_suggested: row.get(10)?,
            base_points: row.get(11)?,
            final_reward_points: row.get(12)?,
            is_focus_task: row.get::<_, i64>(13)? != 0,
            focus_mark_opportunity_used: row.get::<_, i64>(14)? != 0,
        }),
    ).map_err(err)?;

    if task_row.completed {
        return Err("task already completed".to_string());
    }
    if !task_row.setup_completed {
        return Err("task setup not completed".to_string());
    }

    let reward_earned = task_row.base_points;
    let bonus_earned = task_row.final_reward_points - task_row.base_points;

    db.execute(
        "UPDATE tasks SET completed = 1, completed_at = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![now, now, task_id],
    ).map_err(err)?;

    db.execute(
        "UPDATE user_wallet SET
             pending_today_points = pending_today_points + ?1,
             lifetime_points_earned = lifetime_points_earned + ?1
         WHERE id = 1",
        rusqlite::params![task_row.final_reward_points],
    ).map_err(err)?;

    let total_tasks: i64 = db.query_row(
        "SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND setup_completed = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;

    let completed_count: i64 = db.query_row(
        "SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND completed = 1 AND setup_completed = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;

    let focus_completed: i64 = db.query_row(
        "SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND completed = 1 AND is_focus_task = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;

    let points_earned: i64 = db.query_row(
        "SELECT COALESCE(SUM(final_reward_points), 0) FROM tasks WHERE target_date = ?1 AND completed = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;

    let unlocked_ids = load_unlocked_node_ids(&db)?;
    let unlock_status = compute_unlock_status(&unlocked_ids);
    let max_slots: i64 = unlock_status.max_visible_task_slots as i64;
    let all_completed = completed_count == max_slots;

    db.execute(
        "INSERT INTO daily_summary (date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(date) DO UPDATE SET
             tasks_created = ?2,
             tasks_completed = ?3,
             focus_tasks_completed = ?4,
             points_earned = ?5,
             is_all_completed = ?6",
        rusqlite::params![today, total_tasks, completed_count, focus_completed, points_earned, all_completed as i64],
    ).map_err(err)?;

    let updated_wallet = db.query_row(
        "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days,
                lifetime_points_earned, points_spent_on_unlocks, pending_today_unlock_spent
         FROM user_wallet WHERE id = 1",
        [], |row| Ok(UserWallet {
            wallet_points: row.get(0)?,
            pending_today_points: row.get(1)?,
            streak_days: row.get(2)?,
            last_completed_date: row.get(3)?,
            best_streak_days: row.get(4)?,
            lifetime_points_earned: row.get(5)?,
            points_spent_on_unlocks: row.get(6)?,
            pending_today_unlock_spent: row.get(7)?,
        })
    ).map_err(err)?;

    let updated_task = db.query_row(
        "SELECT id, title, target_date, created_at, updated_at, sort_order,
                completed, setup_completed, completed_at,
                difficulty_selected, difficulty_suggested,
                base_points, final_reward_points,
                is_focus_task, focus_mark_opportunity_used
         FROM tasks WHERE id = ?1",
        [&task_id],
        |row| Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            target_date: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            sort_order: row.get(5)?,
            completed: row.get::<_, i64>(6)? != 0,
            setup_completed: row.get::<_, i64>(7)? != 0,
            completed_at: row.get(8)?,
            difficulty_selected: row.get(9)?,
            difficulty_suggested: row.get(10)?,
            base_points: row.get(11)?,
            final_reward_points: row.get(12)?,
            is_focus_task: row.get::<_, i64>(13)? != 0,
            focus_mark_opportunity_used: row.get::<_, i64>(14)? != 0,
        }),
    ).map_err(err)?;

    let today_summary = db.query_row(
        "SELECT date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed
         FROM daily_summary WHERE date = ?1",
        [&today],
        |row| Ok(DailySummary {
            date: row.get(0)?,
            tasks_created: row.get(1)?,
            tasks_completed: row.get(2)?,
            focus_tasks_completed: row.get(3)?,
            points_earned: row.get(4)?,
            is_all_completed: row.get::<_, i64>(5)? != 0,
        }),
    ).map_err(err)?;

    // 算給前端做 +N 動畫的 delta
    let (available_after, _lifetime, _spent) = load_available_points(&db)?;
    let available_delta = task_row.final_reward_points;

    Ok(CompleteTaskResponse {
        task: updated_task,
        reward_earned,
        bonus_earned,
        pending_today_points: updated_wallet.pending_today_points,
        wallet_points: updated_wallet.wallet_points,
        today_summary,
        all_tasks_completed: all_completed,
        streak_days: updated_wallet.streak_days,
        available_points_delta: available_delta,
        available_points_after: available_after,
    })
}

// ─── run_daily_refresh_if_needed ───

#[tauri::command]
pub fn run_daily_refresh_if_needed(
    state: State<'_, AppState>,
) -> Result<RunDailyRefreshIfNeededResponse, String> {
    let db = state.db.lock().map_err(err)?;
    let today = today_str();

    let last_summary_date: Option<String> = db
        .query_row(
            "SELECT date FROM daily_summary WHERE date < ?1 ORDER BY date DESC LIMIT 1",
            [&today],
            |row| row.get(0),
        )
        .ok();

    let needs_refresh = last_summary_date.is_some();

    if !needs_refresh {
        let wallet = db.query_row(
            "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days,
                    lifetime_points_earned, points_spent_on_unlocks, pending_today_unlock_spent
             FROM user_wallet WHERE id = 1",
            [], |row| Ok(UserWallet {
                wallet_points: row.get(0)?,
                pending_today_points: row.get(1)?,
                streak_days: row.get(2)?,
                last_completed_date: row.get(3)?,
                best_streak_days: row.get(4)?,
                lifetime_points_earned: row.get(5)?,
                points_spent_on_unlocks: row.get(6)?,
                pending_today_unlock_spent: row.get(7)?,
            })
        ).map_err(err)?;

        return Ok(RunDailyRefreshIfNeededResponse {
            refresh_applied: false,
            previous_date: None,
            new_date: today,
            wallet,
            previous_summary: None,
        });
    }

    let previous_summary = apply_daily_refresh(&db, &today, &last_summary_date)?;

    let wallet = db.query_row(
        "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days,
                lifetime_points_earned, points_spent_on_unlocks, pending_today_unlock_spent
         FROM user_wallet WHERE id = 1",
        [], |row| Ok(UserWallet {
            wallet_points: row.get(0)?,
            pending_today_points: row.get(1)?,
            streak_days: row.get(2)?,
            last_completed_date: row.get(3)?,
            best_streak_days: row.get(4)?,
            lifetime_points_earned: row.get(5)?,
            points_spent_on_unlocks: row.get(6)?,
            pending_today_unlock_spent: row.get(7)?,
        })
    ).map_err(err)?;

    Ok(RunDailyRefreshIfNeededResponse {
        refresh_applied: true,
        previous_date: last_summary_date,
        new_date: today,
        wallet,
        previous_summary,
    })
}

// ─── dev_force_daily_refresh（開發用） ───

#[tauri::command]
pub fn dev_force_daily_refresh(
    state: State<'_, AppState>,
) -> Result<RunDailyRefreshIfNeededResponse, String> {
    let db = state.db.lock().map_err(err)?;
    let today = today_str();

    let previous_date: Option<String> = db
        .query_row(
            "SELECT date FROM daily_summary ORDER BY date DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    let previous_summary = apply_daily_refresh(&db, &today, &previous_date)?;

    // Dev only: 重置前一天的 summary，讓下次模擬換日能正確判斷
    if let Some(ref prev) = previous_date {
        db.execute(
            "UPDATE daily_summary SET
                tasks_completed = 0,
                focus_tasks_completed = 0,
                points_earned = 0,
                is_all_completed = 0
             WHERE date = ?1",
            [prev],
        ).map_err(err)?;
    }

    // Dev only: 清除今天的 tasks，讓下一天模擬從空白開始
    db.execute(
        "DELETE FROM tasks WHERE target_date = ?1",
        [&today],
    ).map_err(err)?;

    let wallet = db.query_row(
        "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days,
                lifetime_points_earned, points_spent_on_unlocks, pending_today_unlock_spent
         FROM user_wallet WHERE id = 1",
        [], |row| Ok(UserWallet {
            wallet_points: row.get(0)?,
            pending_today_points: row.get(1)?,
            streak_days: row.get(2)?,
            last_completed_date: row.get(3)?,
            best_streak_days: row.get(4)?,
            lifetime_points_earned: row.get(5)?,
            points_spent_on_unlocks: row.get(6)?,
            pending_today_unlock_spent: row.get(7)?,
        })
    ).map_err(err)?;

    Ok(RunDailyRefreshIfNeededResponse {
        refresh_applied: true,
        previous_date,
        new_date: today,
        wallet,
        previous_summary,
    })
}

// ─── 共用 refresh 邏輯 ───

fn apply_daily_refresh(
    db: &rusqlite::Connection,
    today: &str,
    previous_date: &Option<String>,
) -> Result<Option<DailySummary>, String> {
    // pending_today_points → wallet_points，同時歸零今日花費桶
    db.execute(
        "UPDATE user_wallet SET
            wallet_points = wallet_points + pending_today_points - pending_today_unlock_spent,
            pending_today_points = 0,
            pending_today_unlock_spent = 0
         WHERE id = 1",
        [],
    ).map_err(err)?;

    // streak：查前一天完成數，決定 streak +1 或歸零
    let previous_summary: Option<DailySummary> = if let Some(prev_date) = previous_date {
        let summary = db.query_row(
            "SELECT date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed
             FROM daily_summary WHERE date = ?1",
            [prev_date],
            |row| Ok(DailySummary {
                date: row.get(0)?,
                tasks_created: row.get(1)?,
                tasks_completed: row.get(2)?,
                focus_tasks_completed: row.get(3)?,
                points_earned: row.get(4)?,
                is_all_completed: row.get::<_, i64>(5)? != 0,
            }),
        ).ok();

        let tasks_completed = summary.as_ref().map(|s| s.tasks_completed).unwrap_or(0);
        if tasks_completed > 0 {
            db.execute(
                "UPDATE user_wallet SET
                    streak_days = streak_days + 1,
                    best_streak_days = MAX(best_streak_days, streak_days + 1)
                 WHERE id = 1",
                [],
            ).map_err(err)?;
        } else {
            db.execute(
                "UPDATE user_wallet SET streak_days = 0 WHERE id = 1",
                [],
            ).map_err(err)?;
        }

        summary
    } else {
        None
    };

    db.execute(
        "INSERT OR IGNORE INTO daily_summary
            (date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed)
         VALUES (?1, 0, 0, 0, 0, 0)",
        [today],
    ).map_err(err)?;

    Ok(previous_summary)
}


// ─── get_unlock_status ───

#[tauri::command]
pub fn get_unlock_status(state: State<'_, AppState>) -> Result<UnlockStatus, String> {
    let db = state.db.lock().map_err(err)?;
    let unlocked_ids = load_unlocked_node_ids(&db)?;
    Ok(compute_unlock_status(&unlocked_ids))
}

// ─── get_unlock_progress ───

#[tauri::command]
pub fn get_unlock_progress(
    state: State<'_, AppState>,
) -> Result<UnlockProgressResponse, String> {
    let db = state.db.lock().map_err(err)?;
    let unlocked_ids = load_unlocked_node_ids(&db)?;
    let (available, lifetime, spent) = load_available_points(&db)?;

    // 讀每個已解鎖節點的時間戳
    let mut unlocked_at_map: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    {
        let mut stmt = db
            .prepare("SELECT node_id, unlocked_at FROM unlock_nodes")
            .map_err(err)?;
        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(err)?;
        for row in rows {
            let (id, at) = row.map_err(err)?;
            unlocked_at_map.insert(id, at);
        }
    }

    let nodes: Vec<UnlockNodeState> = UNLOCK_CATALOG
        .iter()
        .map(|n| {
            let unlocked = unlocked_ids.contains(n.id);
            let requirements_met =
                n.requires.iter().all(|r| unlocked_ids.contains(*r));
            UnlockNodeState {
                node_id: n.id.to_string(),
                category: n.category.to_string(),
                cost: n.cost,
                requires: n.requires.iter().map(|s| s.to_string()).collect(),
                unlocked,
                unlocked_at: unlocked_at_map.get(n.id).cloned(),
                requirements_met,
                affordable: !unlocked && requirements_met && available >= n.cost,
            }
        })
        .collect();

    Ok(UnlockProgressResponse {
        available_points: available,
        lifetime_points_earned: lifetime,
        points_spent_on_unlocks: spent,
        nodes,
    })
}

// ─── purchase_unlock ───

#[tauri::command]
pub fn purchase_unlock(
    state: State<'_, AppState>,
    node_id: String,
) -> Result<PurchaseUnlockResponse, String> {
    let db = state.db.lock().map_err(err)?;

    // 1. 節點合法性
    let node = find_node(&node_id)
        .ok_or_else(|| format!("unknown unlock node: {}", node_id))?;

    // 2. 是否已解鎖
    let unlocked_ids = load_unlocked_node_ids(&db)?;
    if unlocked_ids.contains(&node_id) {
        return Err("node already unlocked".to_string());
    }

    // 3. 前置
    for req in node.requires {
        if !unlocked_ids.contains(*req) {
            return Err(format!("requirement not met: {}", req));
        }
    }

    // 4. 點數
    let (available, _lifetime, _spent) = load_available_points(&db)?;
    if available < node.cost {
        return Err(format!(
            "not enough points: need {}, have {}",
            node.cost, available
        ));
    }

    // 5. 寫入 + 扣點（同步更新今日花費桶）
    let now = chrono::Local::now().to_rfc3339();
    db.execute(
        "INSERT INTO unlock_nodes (node_id, unlocked_at) VALUES (?1, ?2)",
        rusqlite::params![node_id, now],
    )
    .map_err(err)?;

    db.execute(
        "UPDATE user_wallet SET
            points_spent_on_unlocks = points_spent_on_unlocks + ?1,
            pending_today_unlock_spent = pending_today_unlock_spent + ?1
         WHERE id = 1",
        rusqlite::params![node.cost],
    )
    .map_err(err)?;

    // 6. 回最新狀態
    let new_unlocked_ids = load_unlocked_node_ids(&db)?;
    let new_status = compute_unlock_status(&new_unlocked_ids);
    let (new_available, _new_lifetime, new_spent) = load_available_points(&db)?;

    let new_pending_spent: i64 = db.query_row(
        "SELECT pending_today_unlock_spent FROM user_wallet WHERE id = 1",
        [],
        |row| row.get(0),
    ).map_err(err)?;

    Ok(PurchaseUnlockResponse {
        node_id,
        unlocks: new_status,
        available_points: new_available,
        points_spent_on_unlocks: new_spent,
        pending_today_unlock_spent: new_pending_spent,
    })
}

// ═══════════════════════════════════════════════════════════
// 以下為 Round F 補上的命令 — 貼到 commands.rs 檔案底部
// ═══════════════════════════════════════════════════════════

use serde::Deserialize;

/// update_user_settings 的 patch 欄位 — 全都 optional,只更新有送的欄位。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct UpdateUserSettingsPatch {
    pub theme_mode: Option<String>,
    pub panel_width: Option<i64>,
    pub pin_enabled: Option<bool>,
    pub refresh_time: Option<String>,
}

#[tauri::command]
pub fn update_user_settings(
    state: State<'_, AppState>,
    patch: UpdateUserSettingsPatch,
) -> Result<UserSettings, String> {
    let db = state.db.lock().map_err(err)?;

    // 逐欄位 update — 有送的才改
    if let Some(v) = &patch.theme_mode {
        db.execute(
            "UPDATE user_settings SET theme_mode = ?1 WHERE id = 1",
            [v],
        )
        .map_err(err)?;
    }
    if let Some(v) = patch.panel_width {
        db.execute(
            "UPDATE user_settings SET panel_width = ?1 WHERE id = 1",
            [v],
        )
        .map_err(err)?;
    }
    if let Some(v) = patch.pin_enabled {
        db.execute(
            "UPDATE user_settings SET pin_enabled = ?1 WHERE id = 1",
            [if v { 1i64 } else { 0i64 }],
        )
        .map_err(err)?;
    }
    if let Some(v) = &patch.refresh_time {
        db.execute(
            "UPDATE user_settings SET refresh_time = ?1 WHERE id = 1",
            [v],
        )
        .map_err(err)?;
    }

    // 讀回最新結果
    let settings = db
        .query_row(
            "SELECT theme_mode, panel_width, pin_enabled, refresh_time, trigger_position_y
             FROM user_settings WHERE id = 1",
            [],
            |row| {
                Ok(UserSettings {
                    theme_mode: row.get(0)?,
                    panel_width: row.get(1)?,
                    pin_enabled: row.get::<_, i64>(2)? != 0,
                    refresh_time: row.get(3)?,
                    trigger_position_y: row.get(4)?,
                })
            },
        )
        .map_err(err)?;

    Ok(settings)
}

#[tauri::command]
pub fn update_trigger_position(
    state: State<'_, AppState>,
    trigger_position_y: f64,
) -> Result<UserSettings, String> {
    let db = state.db.lock().map_err(err)?;

    // 保險：限制在 0.0 ~ 1.0
    let clamped = trigger_position_y.clamp(0.0, 1.0);

    db.execute(
        "UPDATE user_settings
         SET trigger_position_y = ?1
         WHERE id = 1",
        [clamped],
    )
    .map_err(err)?;

    let settings = db
        .query_row(
            "SELECT theme_mode, panel_width, pin_enabled, refresh_time, trigger_position_y
             FROM user_settings WHERE id = 1",
            [],
            |row| {
                Ok(UserSettings {
                    theme_mode: row.get(0)?,
                    panel_width: row.get(1)?,
                    pin_enabled: row.get::<_, i64>(2)? != 0,
                    refresh_time: row.get(3)?,
                    trigger_position_y: row.get(4)?,
                })
            },
        )
        .map_err(err)?;

    Ok(settings)
}