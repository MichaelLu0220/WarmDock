export interface UserWallet {
  wallet_points: number           // 累計總積分
  pending_today_points: number    // 今日待解鎖積分（任務完成後才入帳）
  streak_days: number             // 連續完成天數
  last_completed_date: string | null  // "YYYY-MM-DD"
  best_streak_days: number

  // Round A.0 新增: 解鎖系統用
  lifetime_points_earned: number      // 歷史累計賺到的點數（只進不出）
  points_spent_on_unlocks: number     // 歷史累計花在解鎖的點數
  pending_today_unlock_spent: number  // 今日花在解鎖的點數（跨日歸零）
}