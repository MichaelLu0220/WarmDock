use crate::catalog::unlock::compute_unlock_status;
use crate::domain::clock::Clock;
use crate::dto::BootstrapResponse;
use crate::error::AppResult;
use crate::storage::{settings_repo, summary_repo, task_repo, unlock_repo, wallet_repo};
use rusqlite::Connection;

/// 啟動快照:唯讀,單次撈齊所有前端初始資料。
pub fn bootstrap(conn: &Connection, clock: &dyn Clock) -> AppResult<BootstrapResponse> {
    let today = clock.today();
    let tasks = task_repo::list_by_date(conn, &today)?;
    let wallet = wallet_repo::get(conn)?;
    let settings = settings_repo::get(conn)?;
    let summary = summary_repo::get(conn, &today)?;
    let unlocks = compute_unlock_status(&unlock_repo::unlocked_ids(conn)?);

    Ok(BootstrapResponse {
        today,
        tasks,
        wallet,
        settings,
        summary,
        unlocks,
        refresh_applied: false,
    })
}
