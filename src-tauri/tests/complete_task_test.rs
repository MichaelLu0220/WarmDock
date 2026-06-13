mod common;

use common::FakeClock;
use warmdock_lib::domain::task::TaskStatus;
use warmdock_lib::services::task_service;
use warmdock_lib::storage::{self, summary_repo, wallet_repo};

#[test]
fn complete_task_updates_task_wallet_and_summary_atomically() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    let task = task_service::create_task(&mut conn, &clock, "寫整合測試").unwrap();
    assert_eq!(task.status, TaskStatus::Draft);

    let task =
        task_service::set_task_detail(&mut conn, &clock, &task.id, 3, Some("medium".into()), true)
            .unwrap();
    assert_eq!(task.status, TaskStatus::Ready);
    assert_eq!(task.final_reward_points, 4);

    let res = task_service::complete_task(&mut conn, &clock, &task.id).unwrap();

    assert_eq!(res.task.status, TaskStatus::Completed);
    assert_eq!(res.reward_earned, 3);
    assert_eq!(res.bonus_earned, 1);
    assert_eq!(res.pending_today_points, 4);
    assert_eq!(res.available_points_after, 4);

    // 三方一致
    let wallet = wallet_repo::get(&conn).unwrap();
    assert_eq!(wallet.pending_today_points, 4);
    assert_eq!(wallet.lifetime_points_earned, 4);
    assert_eq!(wallet.last_completed_date.as_deref(), Some("2026-06-12"));

    let summary = summary_repo::get(&conn, "2026-06-12").unwrap().unwrap();
    assert_eq!(summary.tasks_created, 1);
    assert_eq!(summary.tasks_completed, 1);
    assert_eq!(summary.focus_tasks_completed, 1);
    assert_eq!(summary.points_earned, 4);
    assert!(!summary.is_all_completed); // 1 完成 < max_slots 3(今日嚴格語意)
}

#[test]
fn complete_rejects_duplicate_and_draft() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    let draft = task_service::create_task(&mut conn, &clock, "還沒設定").unwrap();
    let err = task_service::complete_task(&mut conn, &clock, &draft.id).unwrap_err();
    assert_eq!(err.code(), "TASK_SETUP_INCOMPLETE");

    task_service::set_task_detail(&mut conn, &clock, &draft.id, 2, None, false).unwrap();
    task_service::complete_task(&mut conn, &clock, &draft.id).unwrap();

    let err = task_service::complete_task(&mut conn, &clock, &draft.id).unwrap_err();
    assert_eq!(err.code(), "TASK_ALREADY_COMPLETED");

    let err = task_service::complete_task(&mut conn, &clock, "no-such-id").unwrap_err();
    assert_eq!(err.code(), "TASK_NOT_FOUND");
}

#[test]
fn all_completed_when_reaching_max_slots() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    let mut last = None;
    for i in 0..3 {
        let t = task_service::create_task(&mut conn, &clock, &format!("任務 {i}")).unwrap();
        task_service::set_task_detail(&mut conn, &clock, &t.id, 1, None, false).unwrap();
        last = Some(task_service::complete_task(&mut conn, &clock, &t.id).unwrap());
    }
    let res = last.unwrap();
    assert!(res.all_tasks_completed);
    assert!(res.today_summary.is_all_completed);
}

#[test]
fn create_task_rejects_blank_title() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");
    let err = task_service::create_task(&mut conn, &clock, "   ").unwrap_err();
    assert_eq!(err.code(), "INVALID_INPUT");
}
