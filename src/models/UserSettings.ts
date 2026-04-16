export interface UserSettings {
  theme_mode: "light" | "dark" | "system"
  panel_width: number             // px
  pin_enabled: boolean
  refresh_time: string            // "HH:mm"，每日重置時間
  trigger_position_y: number // 0.0 ~ 1.0，trigger 在右側的垂直位置比例
}