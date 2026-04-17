use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub target_date: String,
    pub created_at: String,
    pub updated_at: String,
    pub sort_order: i64,
    pub completed: bool,
    pub setup_completed: bool,
    pub completed_at: Option<String>,
    pub difficulty_selected: Option<i32>,
    pub difficulty_suggested: Option<String>,
    pub base_points: i64,
    pub final_reward_points: i64,
    pub is_focus_task: bool,
    pub focus_mark_opportunity_used: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserSettings {
    pub theme_mode: String,
    pub panel_width: i64,
    pub pin_enabled: bool,
    pub refresh_time: String,
    pub trigger_position_y: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserWallet {
    pub wallet_points: i64,
    pub pending_today_points: i64,
    pub streak_days: i64,
    pub last_completed_date: Option<String>,
    pub best_streak_days: i64,
	pub lifetime_points_earned: i64,
    pub points_spent_on_unlocks: i64,
	pub pending_today_unlock_spent: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct DailySummary {
    pub date: String,
    pub tasks_created: i64,
    pub tasks_completed: i64,
    pub focus_tasks_completed: i64,
    pub points_earned: i64,
    pub is_all_completed: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct UnlockStatus {
    pub max_visible_task_slots: i64,
    pub focus_task_feature_unlocked: bool,
    pub custom_refresh_time_unlocked: bool,
    pub weekly_analysis_unlocked: bool,
}

#[derive(Debug, Serialize)]
pub struct BootstrapAppResponse {
    pub today: String,
    pub tasks: Vec<Task>,
    pub wallet: UserWallet,
    pub settings: UserSettings,
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
pub struct RunDailyRefreshIfNeededResponse {
    pub refresh_applied: bool,
    pub previous_date: Option<String>,
    pub new_date: String,
    pub wallet: UserWallet,
    pub previous_summary: Option<DailySummary>,
}

#[derive(serde::Serialize)]
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

#[derive(serde::Serialize)]
pub struct UnlockProgressResponse {
    pub available_points: i64,
    pub lifetime_points_earned: i64,
    pub points_spent_on_unlocks: i64,
    pub nodes: Vec<UnlockNodeState>,
}

#[derive(serde::Serialize)]
pub struct PurchaseUnlockResponse {
    pub node_id: String,
    pub unlocks: UnlockStatus,
    pub available_points: i64,
    pub points_spent_on_unlocks: i64,
	pub pending_today_unlock_spent: i64,
}