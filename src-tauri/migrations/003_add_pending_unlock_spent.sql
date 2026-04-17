-- Migration 003: Daily pending unlock spending tracker
-- Adds a per-day bucket that tracks how many points the user spent on
-- unlocking nodes today. Resets to 0 on daily refresh.

ALTER TABLE user_wallet
    ADD COLUMN pending_today_unlock_spent INTEGER NOT NULL DEFAULT 0;