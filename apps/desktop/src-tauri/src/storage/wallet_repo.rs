use super::rows::{wallet_from_row, WALLET_COLS};
use crate::domain::wallet::Wallet;
use crate::error::AppResult;
use rusqlite::{params, Connection};

pub fn get(conn: &Connection) -> AppResult<Wallet> {
    Ok(conn.query_row(
        &format!("SELECT {WALLET_COLS} FROM user_wallet WHERE id = 1"),
        [],
        wallet_from_row,
    )?)
}

/// 整列寫回。錢包異動一律「讀 → domain 方法改 → 寫回」,且必須在 transaction 內。
pub fn save(conn: &Connection, wallet: &Wallet) -> AppResult<()> {
    conn.execute(
        "UPDATE user_wallet SET
            wallet_points = ?1,
            pending_today_points = ?2,
            streak_days = ?3,
            last_completed_date = ?4,
            last_rollover_date = ?5,
            best_streak_days = ?6,
            lifetime_points_earned = ?7,
            points_spent_on_unlocks = ?8,
            pending_today_unlock_spent = ?9
         WHERE id = 1",
        params![
            wallet.wallet_points,
            wallet.pending_today_points,
            wallet.streak_days,
            wallet.last_completed_date,
            wallet.last_rollover_date,
            wallet.best_streak_days,
            wallet.lifetime_points_earned,
            wallet.points_spent_on_unlocks,
            wallet.pending_today_unlock_spent,
        ],
    )?;
    Ok(())
}
