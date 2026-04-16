use tauri::State;
use crate::AppState;
use crate::models::*;

/// 格式化錯誤為字串（Tauri command 的 Err 必須是 String）
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

/// 取得今天日期 YYYY-MM-DD
fn today_str() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
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

    // 計算 sort_order：目前最大值 + 1
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

    // 簡易積分：base = difficulty_selected，focus 額外 +1
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

    // 回傳更新後的 task
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

    // tasks
    // 釋放 db lock 前先收集完資料，這裡直接用同一個 lock
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
    // 必須在下一次 prepare 之前 drop stmt
    drop(stmt);

    // wallet
    let wallet = db
        .query_row("SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days FROM user_wallet WHERE id = 1", [], |row| {
            Ok(UserWallet {
                wallet_points: row.get(0)?,
                pending_today_points: row.get(1)?,
                streak_days: row.get(2)?,
                last_completed_date: row.get(3)?,
                best_streak_days: row.get(4)?,
            })
        })
        .map_err(err)?;

    // settings
    let settings = db
        .query_row("SELECT theme_mode, panel_width, pin_enabled, refresh_time, trigger_position_y FROM user_settings WHERE id = 1", [], |row| {
            Ok(UserSettings {
                theme_mode: row.get(0)?,
                panel_width: row.get(1)?,
                pin_enabled: row.get::<_, i64>(2)? != 0,
                refresh_time: row.get(3)?,
                trigger_position_y: row.get(4)?,
            })
        })
        .map_err(err)?;

    // summary（可能不存在）
    let summary = db
        .query_row(
            "SELECT date, tasks_created, tasks_completed, focus_tasks_completed, points_earned, is_all_completed FROM daily_summary WHERE date = ?1",
            [&today],
            |row| {
                Ok(DailySummary {
                    date: row.get(0)?,
                    tasks_created: row.get(1)?,
                    tasks_completed: row.get(2)?,
                    focus_tasks_completed: row.get(3)?,
                    points_earned: row.get(4)?,
                    is_all_completed: row.get::<_, i64>(5)? != 0,
                })
            },
        )
        .ok();

    // unlocks（MVP 先回傳固定值）
    let unlocks = UnlockStatus {
        max_visible_task_slots: 3,
        focus_task_feature_unlocked: false,
        custom_refresh_time_unlocked: false,
        weekly_analysis_unlocked: false,
    };

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
         UPDATE user_wallet SET
             wallet_points = 0,
             pending_today_points = 0,
             streak_days = 0,
             last_completed_date = NULL,
             best_streak_days = 0
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

    // 取得 task 目前資料
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

    // 標記完成
    db.execute(
        "UPDATE tasks SET completed = 1, completed_at = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![now, now, task_id],
    ).map_err(err)?;

    // 更新 pending_today_points
    db.execute(
        "UPDATE user_wallet SET pending_today_points = pending_today_points + ?1 WHERE id = 1",
        rusqlite::params![task_row.final_reward_points],
    ).map_err(err)?;

    // 統計今日任務狀況
    let total_tasks: i64 = db.query_row(
		"SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND setup_completed = 1", [&today], |r| r.get(0)
	).map_err(err)?;
    let completed_count: i64 = db.query_row(
        "SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND completed = 1", [&today], |r| r.get(0)
    ).map_err(err)?;
    let focus_completed: i64 = db.query_row(
        "SELECT COUNT(*) FROM tasks WHERE target_date = ?1 AND completed = 1 AND is_focus_task = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;
    let points_earned: i64 = db.query_row(
        "SELECT COALESCE(SUM(final_reward_points), 0) FROM tasks WHERE target_date = ?1 AND completed = 1",
        [&today], |r| r.get(0)
    ).map_err(err)?;

    //let all_completed = total_tasks > 0 && completed_count == total_tasks;
	let all_completed = total_tasks == 3 && completed_count == total_tasks;

    // Upsert daily_summary
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

	eprintln!("total_tasks={} completed_count={}", total_tasks, completed_count);

    // 更新 streak（僅在全部完成時）
    if all_completed {
        let (streak_days, last_completed_date, best_streak_days): (i64, Option<String>, i64) = db.query_row(
            "SELECT streak_days, last_completed_date, best_streak_days FROM user_wallet WHERE id = 1",
            [], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
        ).map_err(err)?;

        let already_counted = last_completed_date.as_deref() == Some(&today as &str);
        if !already_counted {
            let yesterday = (chrono::Local::now() - chrono::Duration::days(1))
                .format("%Y-%m-%d").to_string();
            let new_streak = if last_completed_date.as_deref() == Some(&yesterday as &str) {
                streak_days + 1
            } else {
                1
            };
            let new_best = new_streak.max(best_streak_days);
            db.execute(
                "UPDATE user_wallet SET streak_days = ?1, last_completed_date = ?2, best_streak_days = ?3 WHERE id = 1",
                rusqlite::params![new_streak, today, new_best],
            ).map_err(err)?;
        }
    }

    // 回傳最新 wallet、task、summary
    let updated_wallet = db.query_row(
        "SELECT wallet_points, pending_today_points, streak_days, last_completed_date, best_streak_days FROM user_wallet WHERE id = 1",
        [], |row| Ok(UserWallet {
            wallet_points: row.get(0)?,
            pending_today_points: row.get(1)?,
            streak_days: row.get(2)?,
            last_completed_date: row.get(3)?,
            best_streak_days: row.get(4)?,
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

    Ok(CompleteTaskResponse {
        task: updated_task,
        reward_earned,
        bonus_earned,
        pending_today_points: updated_wallet.pending_today_points,
        wallet_points: updated_wallet.wallet_points,
        today_summary,
        all_tasks_completed: all_completed,
        streak_days: updated_wallet.streak_days,
    })
}