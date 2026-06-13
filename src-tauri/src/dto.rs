//! Wire 回應格式(序列化給前端的 response envelope)。
//! 欄位名與舊版 API 相容,前端 Phase 1 只需處理 Task.status 與結構化錯誤兩個變化。

use crate::catalog::unlock::UnlockStatus;
use crate::domain::settings::Settings;
use crate::domain::summary::DailySummary;
use crate::domain::task::Task;
use crate::domain::wallet::Wallet;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BootstrapResponse {
    pub today: String,
    pub tasks: Vec<Task>,
    pub wallet: Wallet,
    pub settings: Settings,
    pub summary: Option<DailySummary>,
    pub unlocks: UnlockStatus,
    pub refresh_applied: bool,
}

#[derive(Debug, Serialize)]
pub struct CompleteTaskResponse {
    pub task: Task,
    pub reward_earned: i64,
    pub bonus_earned: i64,
    pub pending_today_points: i64,
    pub wallet_points: i64,
    pub today_summary: DailySummary,
    pub all_tasks_completed: bool,
    pub streak_days: i64,
    pub available_points_delta: i64,
    pub available_points_after: i64,
}

#[derive(Debug, Serialize)]
pub struct RefreshResponse {
    pub refresh_applied: bool,
    pub previous_date: Option<String>,
    pub new_date: String,
    pub wallet: Wallet,
    pub previous_summary: Option<DailySummary>,
}

#[derive(Debug, Serialize)]
pub struct UnlockNodeState {
    pub node_id: String,
    pub category: String,
    pub cost: i64,
    pub requires: Vec<String>,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub requirements_met: bool,
    pub affordable: bool,
}

#[derive(Debug, Serialize)]
pub struct UnlockProgressResponse {
    pub available_points: i64,
    pub lifetime_points_earned: i64,
    pub points_spent_on_unlocks: i64,
    pub nodes: Vec<UnlockNodeState>,
}

#[derive(Debug, Serialize)]
pub struct PurchaseUnlockResponse {
    pub node_id: String,
    pub unlocks: UnlockStatus,
    pub available_points: i64,
    pub points_spent_on_unlocks: i64,
    pub pending_today_unlock_spent: i64,
}
