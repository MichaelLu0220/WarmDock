use crate::catalog::unlock::{compute_unlock_status, validate_purchase, UNLOCK_CATALOG};
use crate::domain::clock::Clock;
use crate::dto::{PurchaseUnlockResponse, UnlockNodeState, UnlockProgressResponse};
use crate::error::AppResult;
use crate::storage::{unlock_repo, wallet_repo, with_tx};
use rusqlite::Connection;

pub fn progress(conn: &Connection) -> AppResult<UnlockProgressResponse> {
    let unlocked_at = unlock_repo::unlocked_at_map(conn)?;
    let unlocked_ids = unlock_repo::unlocked_ids(conn)?;
    let wallet = wallet_repo::get(conn)?;
    let available = wallet.available_points();

    let nodes = UNLOCK_CATALOG
        .iter()
        .map(|n| {
            let unlocked = unlocked_ids.contains(n.id);
            let requirements_met = n.requires.iter().all(|r| unlocked_ids.contains(*r));
            UnlockNodeState {
                node_id: n.id.to_string(),
                category: n.category.to_string(),
                cost: n.cost,
                requires: n.requires.iter().map(|s| s.to_string()).collect(),
                unlocked,
                unlocked_at: unlocked_at.get(n.id).cloned(),
                requirements_met,
                affordable: !unlocked && requirements_met && available >= n.cost,
            }
        })
        .collect();

    Ok(UnlockProgressResponse {
        available_points: available,
        lifetime_points_earned: wallet.lifetime_points_earned,
        points_spent_on_unlocks: wallet.points_spent_on_unlocks,
        nodes,
    })
}

/// 購買解鎖:寫入節點 + 扣點在同一個 transaction 內。
pub fn purchase(
    conn: &mut Connection,
    clock: &dyn Clock,
    node_id: &str,
) -> AppResult<PurchaseUnlockResponse> {
    let now = clock.now();

    with_tx(conn, move |tx| {
        let mut unlocked_ids = unlock_repo::unlocked_ids(tx)?;
        let mut wallet = wallet_repo::get(tx)?;

        let node = validate_purchase(node_id, &unlocked_ids, wallet.available_points())?;

        unlock_repo::insert(tx, node_id, &now)?;
        wallet.apply_unlock_spend(node.cost);
        wallet_repo::save(tx, &wallet)?;

        unlocked_ids.insert(node_id.to_string());
        Ok(PurchaseUnlockResponse {
            node_id: node_id.to_string(),
            unlocks: compute_unlock_status(&unlocked_ids),
            available_points: wallet.available_points(),
            points_spent_on_unlocks: wallet.points_spent_on_unlocks,
            pending_today_unlock_spent: wallet.pending_today_unlock_spent,
        })
    })
}
