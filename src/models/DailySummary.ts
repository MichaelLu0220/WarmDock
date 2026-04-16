export interface DailySummary {
  date: string                // "YYYY-MM-DD"
  tasks_created: number
  tasks_completed: number
  points_earned: number
  is_all_completed: boolean
  focus_tasks_completed: number
}