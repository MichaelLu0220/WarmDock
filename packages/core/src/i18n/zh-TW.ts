/**
 * zh-TW 字典 — 所有使用者可見字串的唯一所在地。
 * key 採「區域.用途」扁平命名;插值用 {name}。
 * 未來加英文版:新增 en.ts 同形字典 + settings.locale 切換。
 */
export const zhTW = {
  // App / Panel 外殼
  "app.loading": "載入中…",
  "app.bootstrapFailed": "啟動失敗:{message}",
  "app.crashTitle": "出了一點狀況",
  "app.crashBody": "WarmDock 遇到預期外的錯誤。",
  "app.crashRetry": "重新載入",
  "app.reconnected": "已恢復連線",

  // Panel header
  "header.greeting": "今天想完成什麼?",
  "header.pin": "固定 panel(不自動關閉)",
  "header.unpin": "取消固定",
  "header.settings": "設定",
  "header.unlockTree": "能力配置",
  "header.streakDays": "{days} 天",

  // Panel footer
  "footer.timeLeft": "剩 {time}",

  // Task
  "task.slotPlaceholder": "+ 新增任務...",
  "task.needsSetup": "待設定",
  "task.completeAria": "完成任務",

  // Task detail modal
  "detail.title": "設定任務難度",
  "detail.suggestion": "系統建議: {band}",
  "detail.focusOption": "標記為 Focus 任務(+1 點)",
  "detail.confirm": "確認",
  "detail.saving": "儲存中...",
  "detail.later": "稍後再設",

  // Difficulty bands
  "difficulty.easy": "簡單",
  "difficulty.medium": "中等",
  "difficulty.hard": "困難",

  // Settings panel
  "settings.title": "設定",
  "settings.theme": "主題",
  "settings.themeLight": "亮色",
  "settings.themeDark": "暗色",
  "settings.themeSystem": "系統",
  "settings.panelWidth": "面板寬度",
  "settings.widthStandard": "標準",
  "settings.widthWide": "寬",
  "settings.behavior": "面板行為",
  "settings.pinLabel": "固定面板(失焦不自動收起)",
  "settings.refreshTime": "每日重置時間",
  "settings.saveFailed": "儲存失敗:{message}",
  "settings.done": "完成",
  "settings.quit": "結束 WarmDock",

  // Ceremony
  "ceremony.allDoneTitle": "今天的承諾,都兌現了",
  "ceremony.allDoneSubtitle": "好好休息,明天見。",
  "ceremony.viewTasks": "查看今日任務",
  "ceremony.statPoints": "獲得積分",
  "ceremony.statStreak": "連續天數",
  "ceremony.statCompleted": "完成任務",
  "ceremony.prevFullTitle": "昨天的承諾,全都兌現了",
  "ceremony.prevPartialTitle": "昨天也走了一段路",
  "ceremony.prevEmptyTitle": "新的一天開始了",
  "ceremony.startToday": "開始今天",
  "ceremony.flashHint": "點擊任意處繼續",

  // Unlock tree
  "unlock.title": "能力配置",
  "unlock.available": "可用 {points}",
  "unlock.close": "關閉",
  "unlock.categoryRoot": "核心",
  "unlock.categoryCapacity": "容量",
  "unlock.categoryFocus": "焦點",
  "unlock.categoryTime": "節奏",
  "unlock.categoryAnalysis": "分析",
  "unlock.categoryDefault": "能力",
  "unlock.stateUnlocked": "已解鎖",
  "unlock.stateDormant": "未覺醒",
  "unlock.stateBlocked": "前置未滿足",
  "unlock.statePurchasable": "可解鎖",
  "unlock.stateInsufficient": "點數不足",
  "unlock.stateAwaiting": "等待覺醒",
  "unlock.noRequirement": "無前置需求",
  "unlock.holdToConfirm": "長按確認解鎖",
  "unlock.holdHint": "按住節點 2 秒解鎖",
  "unlock.maximize": "放大到螢幕中央",
  "unlock.restore": "縮回側邊",
  "unlock.cost": "花費 {points}",
  "unlock.remainAfterBuy": "解鎖後剩 {points}",
  "unlock.missingPoints": "還差 {points}",

  // 錯誤碼 → 訊息
  "error.TASK_NOT_FOUND": "找不到這個任務",
  "error.TASK_ALREADY_COMPLETED": "任務已經完成了",
  "error.TASK_SETUP_INCOMPLETE": "請先設定任務難度",
  "error.TASK_DETAIL_ALREADY_SET": "任務難度已設定,不能再修改",
  "error.UNKNOWN_UNLOCK_NODE": "未知的解鎖節點",
  "error.ALREADY_UNLOCKED": "這個能力已經解鎖了",
  "error.REQUIREMENT_NOT_MET": "前置條件還沒滿足",
  "error.INSUFFICIENT_POINTS": "點數不足",
  "error.INVALID_INPUT": "輸入內容不正確",
  "error.NOT_AUTHENTICATED": "尚未登入",
  "error.CYCLE_SETTLED": "今天已結算,無法再變更",
  "error.OFFLINE": "目前離線,僅能檢視快取資料",
  "error.DB_ERROR": "資料儲存發生問題",
  "error.UNKNOWN": "發生未知錯誤",

  // Account / deletion
  "account.title": "帳號",
  "account.signOut": "登出",
  "account.deleteTitle": "刪除帳號",
  "account.deleteWarning":
    "刪除後帳號會立即停用並登出所有裝置,30 天後永久刪除雲端資料與本機快取。期間內再次登入即可恢復。",
  "account.deleteButton": "刪除我的帳號",
  "account.deleteConfirm": "確認刪除",
  "account.deleteCancel": "取消",
  "account.deleting": "處理中…",
  "account.recoverTitle": "恢復帳號?",
  "account.recoverBody": "你的帳號正在 30 天刪除寬限期內。要恢復並繼續使用 WarmDock 嗎?",
  "account.recoverButton": "恢復帳號",
  "account.recovering": "恢復中…",

  // Footer mantra 池(逗號分隔的特殊處理見 mantras.ts)
} as const;

/** Footer 顯示用的短句池。短、溫暖、不用驚嘆號。 */
export const MANTRAS_ZH_TW: readonly string[] = [
  "一步一步走。",
  "今天不用完美。",
  "承諾不是清單,是選擇。",
  "小事也算數。",
  "慢慢來也來得及。",
  "每天都是新的起點。",
  "你已經在路上了。",
  "做得到的,就做。",
  "不必跟昨天比。",
  "走多遠都好,別忘了方向。",
  "今天值得被記得。",
  "節奏是自己的。",
  "靜靜完成,就夠了。",
  "一件一件來。",
  "你不必全部都扛。",
  "今天的你也很好。",
];
