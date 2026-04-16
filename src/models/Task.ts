export interface Task {
  id: string                  // UUID
  title: string
  target_date: string         // "YYYY-MM-DD"
  created_at: string          // ISO datetime
  updated_at: string          // ISO datetime
  completed: boolean
  setup_completed: boolean
  completed_at: string | null

  difficulty_selected: 1 | 2 | 3 | 4 | 5 | null
  difficulty_suggested: "easy" | "medium" | "hard" | null

  base_points: number
  final_reward_points: number

  is_focus_task: boolean
  focus_mark_opportunity_used: boolean
  
  sort_order: number
}