mod common;

use common::FakeClock;
use warmdock_lib::services::{refresh_service, task_service, unlock_service};
use warmdock_lib::storage::{self, summary_repo, wallet_repo};

#[test]
fn first_launch_needs_no_refresh() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    let res = refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    assert!(!res.refresh_applied);
    assert!(res.previous_date.is_none());
}

#[test]
fn crossing_day_settles_pending_and_extends_streak() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    // 第一天:完成一個 difficulty 3 任務
    let t = task_service::create_task(&mut conn, &clock, "day1 task").unwrap();
    task_service::set_task_detail(&mut conn, &clock, &t.id, 3, None, false).unwrap();
    task_service::complete_task(&mut conn, &clock, &t.id).unwrap();

    // 跨日
    clock.set_today("2026-06-13");
    let res = refresh_service::run_if_needed(&mut conn, &clock).unwrap();

    assert!(res.refresh_applied);
    assert_eq!(res.previous_date.as_deref(), Some("2026-06-12"));
    assert_eq!(res.wallet.wallet_points, 3); // pending 轉正
    assert_eq!(res.wallet.pending_today_points, 0);
    assert_eq!(res.wallet.streak_days, 1);
    let prev = res.previous_summary.unwrap();
    assert_eq!(prev.tasks_completed, 1);

    // 今天的空 summary 已建立
    let today = summary_repo::get(&conn, "2026-06-13").unwrap().unwrap();
    assert_eq!(today.tasks_completed, 0);

    // 同一天再跑一次:不會重複結算(原版的隱藏 bug,重寫後修正)
    let res2 = refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    assert!(!res2.refresh_applied);
    assert_eq!(wallet_repo::get(&conn).unwrap().streak_days, 1);
}

#[test]
fn zero_completed_breaks_streak() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    // 第一天完成一個任務 → streak 1
    let t = task_service::create_task(&mut conn, &clock, "d1").unwrap();
    task_service::set_task_detail(&mut conn, &clock, &t.id, 1, None, false).unwrap();
    task_service::complete_task(&mut conn, &clock, &t.id).unwrap();
    clock.set_today("2026-06-13");
    refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    assert_eq!(wallet_repo::get(&conn).unwrap().streak_days, 1);

    // 第二天什麼都沒完成 → 跨到第三天 streak 歸零
    clock.set_today("2026-06-14");
    let res = refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    assert!(res.refresh_applied);
    assert_eq!(res.wallet.streak_days, 0);
    assert_eq!(res.wallet.best_streak_days, 1); // best 保留
}

#[test]
fn refresh_settles_unlock_spend() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    // 賺 35 點(difficulty 5 ×7 不行,max 3 slots... 用 5+5+5 = 15?不夠買 slots.4(30)。
    // 直接完成 3 個任務全 5 分 = 15,改買 time.custom_refresh(20)也不夠。
    // 所以先賺兩天:今天 15 → 結轉,明天再 15。
    for i in 0..3 {
        let t = task_service::create_task(&mut conn, &clock, &format!("t{i}")).unwrap();
        task_service::set_task_detail(&mut conn, &clock, &t.id, 5, None, false).unwrap();
        task_service::complete_task(&mut conn, &clock, &t.id).unwrap();
    }
    clock.set_today("2026-06-13");
    refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    for i in 0..3 {
        let t = task_service::create_task(&mut conn, &clock, &format!("d2-{i}")).unwrap();
        task_service::set_task_detail(&mut conn, &clock, &t.id, 5, None, false).unwrap();
        task_service::complete_task(&mut conn, &clock, &t.id).unwrap();
    }
    // 可用 30:買 root.awaken(0) + slots.4(30)
    unlock_service::purchase(&mut conn, &clock, "root.awaken").unwrap();
    unlock_service::purchase(&mut conn, &clock, "slots.4").unwrap();

    let w = wallet_repo::get(&conn).unwrap();
    assert_eq!(w.available_points(), 0);
    assert_eq!(w.pending_today_unlock_spent, 30);

    // 跨日:wallet = 15(昨天) + 15(pending) - 30(花費) = 0
    clock.set_today("2026-06-14");
    let res = refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    assert_eq!(res.wallet.wallet_points, 0);
    assert_eq!(res.wallet.pending_today_unlock_spent, 0);
    assert_eq!(res.wallet.points_spent_on_unlocks, 30); // 歷史記錄保留
}
