use crate::domain::clock::Clock;
use crate::domain::summary::DailySummary;
use crate::dto::RefreshResponse;
use crate::error::AppResult;
use crate::storage::{summary_repo, task_repo, wallet_repo, with_tx};
use rusqlite::{Connection, Transaction};

/// 結算共用邏輯:pending 轉正 + streak 更新 + 建今天的空 summary。
fn apply_rollover(
    tx: &Transaction,
    today: &str,
    previous_date: Option<&str>,
) -> AppResult<Option<DailySummary>> {
    let previous_summary = match previous_date {
        Some(date) => summary_repo::get(tx, date)?,
        None => None,
    };

    let mut wallet = wallet_repo::get(tx)?;
    wallet.rollover(today, previous_summary.as_ref());
    wallet_repo::save(tx, &wallet)?;

    summary_repo::ensure_row(tx, today)?;
    Ok(previous_summary)
}

/// 換日檢查:存在早於今天的 summary 才需要結算,整段在 transaction 內。
pub fn run_if_needed(conn: &mut Connection, clock: &dyn Clock) -> AppResult<RefreshResponse> {
    let today = clock.today();

    with_tx(conn, move |tx| {
        let previous_date = summary_repo::latest_date_before(tx, &today)?;
        let wallet = wallet_repo::get(tx)?;

        // 沒有前一天,或今天已結算過(同日重複呼叫)→ 不再結算
        if previous_date.is_none() || wallet.already_rolled_over(&today) {
            return Ok(RefreshResponse {
                refresh_applied: false,
                previous_date: None,
                new_date: today.clone(),
                wallet,
                previous_summary: None,
            });
        }

        let previous_summary = apply_rollover(tx, &today, previous_date.as_deref())?;
        Ok(RefreshResponse {
            refresh_applied: true,
            previous_date,
            new_date: today.clone(),
            wallet: wallet_repo::get(tx)?,
            previous_summary,
        })
    })
}

/// dev 模擬換日:不等真正跨日,直接走一次結算,並清掉今天的任務與
/// 前一天的完成數,讓下一輪模擬從乾淨狀態開始。
#[cfg(debug_assertions)]
pub fn force_refresh(conn: &mut Connection, clock: &dyn Clock) -> AppResult<RefreshResponse> {
    let today = clock.today();

    with_tx(conn, move |tx| {
        let previous_date = summary_repo::latest_date(tx)?;
        let previous_summary = apply_rollover(tx, &today, previous_date.as_deref())?;

        if let Some(prev) = &previous_date {
            if let Some(mut s) = summary_repo::get(tx, prev)? {
                s.tasks_completed = 0;
                s.focus_tasks_completed = 0;
                s.points_earned = 0;
                s.is_all_completed = false;
                summary_repo::upsert(tx, &s)?;
            }
        }
        task_repo::delete_by_date(tx, &today)?;

        Ok(RefreshResponse {
            refresh_applied: true,
            previous_date,
            new_date: today.clone(),
            wallet: wallet_repo::get(tx)?,
            previous_summary,
        })
    })
}
