use super::task::{Task, TaskStatus};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct DailySummary {
    pub date: String,
    pub tasks_created: i64,
    pub tasks_completed: i64,
    pub focus_tasks_completed: i64,
    pub points_earned: i64,
    pub is_all_completed: bool,
}

impl DailySummary {
    pub fn empty(date: String) -> Self {
        DailySummary {
            date,
            tasks_created: 0,
            tasks_completed: 0,
            focus_tasks_completed: 0,
            points_earned: 0,
            is_all_completed: false,
        }
    }

    /// 由當日任務清單整批重算(取代散落的 COUNT/SUM SQL)。
    /// tasks_created 只計 setup 完成的任務(draft 不算承諾);
    /// is_all_completed 採「今日嚴格」語意:完成數 == 已解鎖格位上限。
    pub fn recompute(date: &str, tasks: &[Task], max_slots: i64) -> Self {
        let tasks_created = tasks
            .iter()
            .filter(|t| t.status != TaskStatus::Draft)
            .count() as i64;
        let completed: Vec<&Task> = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Completed)
            .collect();
        let tasks_completed = completed.len() as i64;
        let focus_tasks_completed = completed.iter().filter(|t| t.is_focus).count() as i64;
        let points_earned = completed.iter().map(|t| t.final_reward_points).sum();

        DailySummary {
            date: date.to_string(),
            tasks_created,
            tasks_completed,
            focus_tasks_completed,
            points_earned,
            is_all_completed: tasks_completed == max_slots,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn task(status: TaskStatus, is_focus: bool, reward: i64) -> Task {
        let mut t = Task::new_draft("id".into(), "t".into(), "2026-06-12".into(), "n".into(), 0);
        t.status = status;
        t.is_focus = is_focus;
        t.final_reward_points = reward;
        t
    }

    #[test]
    fn recompute_counts_and_sums() {
        let tasks = vec![
            task(TaskStatus::Draft, false, 0),
            task(TaskStatus::Ready, false, 3),
            task(TaskStatus::Completed, true, 4),
            task(TaskStatus::Completed, false, 2),
        ];
        let s = DailySummary::recompute("2026-06-12", &tasks, 3);
        assert_eq!(s.tasks_created, 3); // draft 不算
        assert_eq!(s.tasks_completed, 2);
        assert_eq!(s.focus_tasks_completed, 1);
        assert_eq!(s.points_earned, 6);
        assert!(!s.is_all_completed);
    }

    #[test]
    fn all_completed_is_strict_against_max_slots() {
        let tasks = vec![
            task(TaskStatus::Completed, false, 1),
            task(TaskStatus::Completed, false, 1),
            task(TaskStatus::Completed, false, 1),
        ];
        assert!(DailySummary::recompute("d", &tasks, 3).is_all_completed);
        assert!(!DailySummary::recompute("d", &tasks, 4).is_all_completed);
    }
}
