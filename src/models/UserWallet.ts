export interface UserWallet {
  wallet_points: number           // 累計總積分
  pending_today_points: number    // 今日待解鎖積分（任務完成後才入帳）
  streak_days: number             // 連續完成天數
  last_completed_date: string | null  // "YYYY-MM-DD"
  best_streak_days: number
}