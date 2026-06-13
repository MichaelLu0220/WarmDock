use crate::error::{AppError, AppResult};
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Draft,
    Ready,
    Completed,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Draft => "draft",
            TaskStatus::Ready => "ready",
            TaskStatus::Completed => "completed",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "draft" => Some(TaskStatus::Draft),
            "ready" => Some(TaskStatus::Ready),
            "completed" => Some(TaskStatus::Completed),
            _ => None,
        }
    }
}

/// 領域 Task。wire 序列化沿用舊欄位名(difficulty_selected / is_focus_task),
/// 讓 Phase 1 期間舊前端只需處理 status 一個新欄位。
#[derive(Debug, Clone, Serialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub target_date: String,
    pub created_at: String,
    pub updated_at: String,
    pub sort_order: i64,
    pub status: TaskStatus,
    pub completed_at: Option<String>,
    #[serde(rename = "difficulty_selected")]
    pub difficulty: Option<i64>,
    pub difficulty_suggested: Option<String>,
    pub base_points: i64,
    pub final_reward_points: i64,
    #[serde(rename = "is_focus_task")]
    pub is_focus: bool,
}

impl Task {
    pub fn new_draft(
        id: String,
        title: String,
        target_date: String,
        now: String,
        sort_order: i64,
    ) -> Self {
        Task {
            id,
            title,
            target_date,
            created_at: now.clone(),
            updated_at: now,
            sort_order,
            status: TaskStatus::Draft,
            completed_at: None,
            difficulty: None,
            difficulty_suggested: None,
            base_points: 0,
            final_reward_points: 0,
            is_focus: false,
        }
    }

    /// detail setup:只有 draft 可以設定(任務建立後不可重新編輯)
    pub fn apply_detail(
        &mut self,
        difficulty: i64,
        difficulty_suggested: Option<String>,
        is_focus: bool,
        now: String,
    ) -> AppResult<()> {
        match self.status {
            TaskStatus::Completed => return Err(AppError::TaskAlreadyCompleted),
            TaskStatus::Ready => return Err(AppError::TaskDetailAlreadySet),
            TaskStatus::Draft => {}
        }
        super::points::validate_difficulty(difficulty)?;

        self.difficulty = Some(difficulty);
        self.difficulty_suggested = difficulty_suggested;
        self.is_focus = is_focus;
        self.base_points = super::points::base_points(difficulty);
        self.final_reward_points = super::points::final_reward(difficulty, is_focus);
        self.status = TaskStatus::Ready;
        self.updated_at = now;
        Ok(())
    }

    /// 完成任務:只有 ready 可以完成
    pub fn complete(&mut self, now: String) -> AppResult<()> {
        match self.status {
            TaskStatus::Completed => return Err(AppError::TaskAlreadyCompleted),
            TaskStatus::Draft => return Err(AppError::TaskSetupIncomplete),
            TaskStatus::Ready => {}
        }
        self.status = TaskStatus::Completed;
        self.completed_at = Some(now.clone());
        self.updated_at = now;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn draft() -> Task {
        Task::new_draft(
            "t1".into(),
            "寫測試".into(),
            "2026-06-12".into(),
            "now".into(),
            0,
        )
    }

    #[test]
    fn detail_moves_draft_to_ready_and_computes_points() {
        let mut t = draft();
        t.apply_detail(3, Some("medium".into()), true, "now2".into())
            .unwrap();
        assert_eq!(t.status, TaskStatus::Ready);
        assert_eq!(t.base_points, 3);
        assert_eq!(t.final_reward_points, 4); // focus bonus +1
    }

    #[test]
    fn detail_rejects_invalid_difficulty() {
        let mut t = draft();
        assert!(t.apply_detail(0, None, false, "now".into()).is_err());
        assert!(t.apply_detail(6, None, false, "now".into()).is_err());
    }

    #[test]
    fn detail_cannot_be_set_twice() {
        let mut t = draft();
        t.apply_detail(2, None, false, "now".into()).unwrap();
        let err = t.apply_detail(3, None, false, "now".into()).unwrap_err();
        assert_eq!(err.code(), "TASK_DETAIL_ALREADY_SET");
    }

    #[test]
    fn complete_requires_ready() {
        let mut t = draft();
        assert_eq!(
            t.complete("now".into()).unwrap_err().code(),
            "TASK_SETUP_INCOMPLETE"
        );
        t.apply_detail(1, None, false, "now".into()).unwrap();
        t.complete("now2".into()).unwrap();
        assert_eq!(t.status, TaskStatus::Completed);
        assert_eq!(
            t.complete("now3".into()).unwrap_err().code(),
            "TASK_ALREADY_COMPLETED"
        );
    }
}
