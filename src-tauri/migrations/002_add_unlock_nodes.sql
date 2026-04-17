-- Migration 002: Unlock nodes system
-- Adds node-based unlock tracking and lifetime points accounting.

CREATE TABLE IF NOT EXISTS unlock_nodes (
    node_id TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL
);

ALTER TABLE user_wallet ADD COLUMN lifetime_points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_wallet ADD COLUMN points_spent_on_unlocks INTEGER NOT NULL DEFAULT 0;

-- Backfill: 把既有使用者的 wallet_points 當成歷史已賺總量。
-- 新使用者不受影響(DEFAULT 0)。
UPDATE user_wallet
SET lifetime_points_earned = wallet_points
WHERE id = 1;