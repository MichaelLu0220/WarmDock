mod common;

use common::FakeClock;
use warmdock_lib::services::{task_service, unlock_service};
use warmdock_lib::storage::{self, unlock_repo, wallet_repo};

fn earn_points(conn: &mut rusqlite::Connection, clock: &FakeClock, count: usize) {
    for i in 0..count {
        let t = task_service::create_task(conn, clock, &format!("earn {i}")).unwrap();
        task_service::set_task_detail(conn, clock, &t.id, 5, None, false).unwrap();
        task_service::complete_task(conn, clock, &t.id).unwrap();
    }
}

#[test]
fn purchase_writes_node_and_deducts_atomically() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");
    earn_points(&mut conn, &clock, 3); // 15 點

    let res = unlock_service::purchase(&mut conn, &clock, "root.awaken").unwrap();
    assert_eq!(res.available_points, 15); // cost 0
    assert!(unlock_repo::unlocked_ids(&conn)
        .unwrap()
        .contains("root.awaken"));

    // time.custom_refresh cost 20:15 - 20 不夠,先跨日再賺 15
    clock.set_today("2026-06-13");
    warmdock_lib::services::refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    earn_points(&mut conn, &clock, 3); // 可用 30

    let res = unlock_service::purchase(&mut conn, &clock, "time.custom_refresh").unwrap();
    assert_eq!(res.available_points, 10); // 30 - 20
    assert!(res.unlocks.custom_refresh_time_unlocked);

    let wallet = wallet_repo::get(&conn).unwrap();
    assert_eq!(wallet.points_spent_on_unlocks, 20);
    assert_eq!(wallet.pending_today_unlock_spent, 20);
}

#[test]
fn purchase_error_codes() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");

    // 未知節點
    let err = unlock_service::purchase(&mut conn, &clock, "ghost").unwrap_err();
    assert_eq!(err.code(), "UNKNOWN_UNLOCK_NODE");

    // 前置未滿足
    let err = unlock_service::purchase(&mut conn, &clock, "slots.4").unwrap_err();
    assert_eq!(err.code(), "REQUIREMENT_NOT_MET");

    // 點數不足(root.awaken 免費先解)
    unlock_service::purchase(&mut conn, &clock, "root.awaken").unwrap();
    let err = unlock_service::purchase(&mut conn, &clock, "slots.4").unwrap_err();
    assert_eq!(err.code(), "INSUFFICIENT_POINTS");
    // 點數不足時不能有任何寫入
    assert!(!unlock_repo::unlocked_ids(&conn)
        .unwrap()
        .contains("slots.4"));
    assert_eq!(wallet_repo::get(&conn).unwrap().points_spent_on_unlocks, 0);

    // 重複購買
    let err = unlock_service::purchase(&mut conn, &clock, "root.awaken").unwrap_err();
    assert_eq!(err.code(), "ALREADY_UNLOCKED");
}

#[test]
fn purchase_unlocks_more_slots() {
    let mut conn = storage::open_in_memory().unwrap();
    let clock = FakeClock::new("2026-06-12");
    earn_points(&mut conn, &clock, 3); // 15
    clock.set_today("2026-06-13");
    warmdock_lib::services::refresh_service::run_if_needed(&mut conn, &clock).unwrap();
    earn_points(&mut conn, &clock, 3); // +15 = 30 可用

    unlock_service::purchase(&mut conn, &clock, "root.awaken").unwrap();
    let res = unlock_service::purchase(&mut conn, &clock, "slots.4").unwrap();

    assert_eq!(res.unlocks.max_visible_task_slots, 4);
    assert_eq!(res.available_points, 0);
    assert_eq!(res.pending_today_unlock_spent, 30);

    let progress = unlock_service::progress(&conn).unwrap();
    let slots5 = progress
        .nodes
        .iter()
        .find(|n| n.node_id == "slots.5")
        .unwrap();
    assert!(slots5.requirements_met);
    assert!(!slots5.affordable); // 0 點,買不起
}
