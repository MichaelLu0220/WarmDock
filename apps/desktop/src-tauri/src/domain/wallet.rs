use super::summary::DailySummary;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Wallet {
    pub wallet_points: i64,
    pub pending_today_points: i64,
    pub streak_days: i64,
    pub last_completed_date: Option<String>,
    /// 最後一次每日結算發生在哪一天,防止同日重複結算
    pub last_rollover_date: Option<String>,
    pub best_streak_days: i64,
    pub lifetime_points_earned: i64,
    pub points_spent_on_unlocks: i64,
    pub pending_today_unlock_spent: i64,
}

impl Wallet {
    /// 目前可花點數 = 已入帳 + 今日待入帳 - 今日已花在解鎖
    pub fn available_points(&self) -> i64 {
        self.wallet_points + self.pending_today_points - self.pending_today_unlock_spent
    }

    /// 完成任務:獎勵進今日待入帳桶
    pub fn apply_completion(&mut self, reward: i64) {
        self.pending_today_points += reward;
        self.lifetime_points_earned += reward;
    }

    /// 購買解鎖:記到歷史花費與今日花費桶(結算時一併沖銷)
    pub fn apply_unlock_spend(&mut self, cost: i64) {
        self.points_spent_on_unlocks += cost;
        self.pending_today_unlock_spent += cost;
    }

    /// 同一天是否已經結算過(防重複 streak +1 / 重複轉帳)
    pub fn already_rolled_over(&self, today: &str) -> bool {
        self.last_rollover_date.as_deref() == Some(today)
    }

    /// 每日結算:pending 轉正、今日花費沖銷歸零、依前一天完成數更新 streak。
    /// `prev_summary` 為 None 表示沒有前一天(首次啟動),streak 不動。
    pub fn rollover(&mut self, today: &str, prev_summary: Option<&DailySummary>) {
        self.wallet_points += self.pending_today_points - self.pending_today_unlock_spent;
        self.pending_today_points = 0;
        self.pending_today_unlock_spent = 0;
        self.last_rollover_date = Some(today.to_string());

        if let Some(prev) = prev_summary {
            if prev.tasks_completed > 0 {
                self.streak_days += 1;
                self.best_streak_days = self.best_streak_days.max(self.streak_days);
            } else {
                self.streak_days = 0;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wallet() -> Wallet {
        Wallet {
            wallet_points: 100,
            pending_today_points: 10,
            streak_days: 2,
            last_completed_date: None,
            last_rollover_date: None,
            best_streak_days: 5,
            lifetime_points_earned: 200,
            points_spent_on_unlocks: 50,
            pending_today_unlock_spent: 3,
        }
    }

    fn summary(completed: i64) -> DailySummary {
        DailySummary {
            date: "2026-06-11".into(),
            tasks_created: 3,
            tasks_completed: completed,
            focus_tasks_completed: 0,
            points_earned: 0,
            is_all_completed: false,
        }
    }

    #[test]
    fn available_subtracts_today_spend() {
        assert_eq!(wallet().available_points(), 107);
    }

    #[test]
    fn completion_feeds_pending_and_lifetime() {
        let mut w = wallet();
        w.apply_completion(4);
        assert_eq!(w.pending_today_points, 14);
        assert_eq!(w.lifetime_points_earned, 204);
        assert_eq!(w.wallet_points, 100); // 不直接入帳
    }

    #[test]
    fn rollover_transfers_and_continues_streak() {
        let mut w = wallet();
        w.rollover("2026-06-12", Some(&summary(2)));
        assert_eq!(w.wallet_points, 107); // 100 + 10 - 3
        assert_eq!(w.pending_today_points, 0);
        assert_eq!(w.pending_today_unlock_spent, 0);
        assert_eq!(w.streak_days, 3);
        assert_eq!(w.best_streak_days, 5);
        assert!(w.already_rolled_over("2026-06-12"));
        assert!(!w.already_rolled_over("2026-06-13"));
    }

    #[test]
    fn rollover_breaks_streak_on_zero_completed() {
        let mut w = wallet();
        w.rollover("2026-06-12", Some(&summary(0)));
        assert_eq!(w.streak_days, 0);
        assert_eq!(w.best_streak_days, 5); // best 保留
    }

    #[test]
    fn rollover_updates_best_streak() {
        let mut w = wallet();
        w.streak_days = 5;
        w.rollover("2026-06-12", Some(&summary(1)));
        assert_eq!(w.streak_days, 6);
        assert_eq!(w.best_streak_days, 6);
    }

    #[test]
    fn rollover_without_previous_day_keeps_streak() {
        let mut w = wallet();
        w.rollover("2026-06-12", None);
        assert_eq!(w.streak_days, 2);
        assert_eq!(w.wallet_points, 107);
    }
}
