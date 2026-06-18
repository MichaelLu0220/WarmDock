/**
 * English dictionary — mirrors zh-TW.ts key-for-key. The first WarmDock release
 * is English-only; the Record type enforces that every key stays translated.
 */
import type { zhTW } from "./zh-TW";

export const en: Record<keyof typeof zhTW, string> = {
  // App / Panel shell
  "app.loading": "Loading…",
  "app.bootstrapFailed": "Startup failed: {message}",
  "app.crashTitle": "Something went wrong",
  "app.crashBody": "WarmDock hit an unexpected error.",
  "app.crashRetry": "Reload",
  "app.reconnected": "Back online",

  // Panel header
  "header.greeting": "What do you want to finish today?",
  "header.prompt": "What matters today?",
  "header.pin": "Pin panel (don't auto-close)",
  "header.unpin": "Unpin",
  "header.settings": "Settings",
  "header.unlockTree": "Abilities",
  "header.streakDays": "{days}d",
  "header.streakLong": "{days} days",

  // Panel footer
  "footer.timeLeft": "{time} left",
  "footer.points": "+{points} points",

  // Task
  "task.slotPlaceholder": "+ Add a task...",
  "task.needsSetup": "Needs setup",
  "task.focus": "Focus",
  "task.completeAria": "Complete task",

  // Task detail modal
  "detail.title": "Set task difficulty",
  "detail.suggestion": "Suggested: {band}",
  "detail.focusOption": "Mark as a Focus task (+1 point)",
  "detail.confirm": "Confirm",
  "detail.saving": "Saving...",
  "detail.later": "Set later",

  // Difficulty bands
  "difficulty.easy": "Easy",
  "difficulty.medium": "Medium",
  "difficulty.hard": "Hard",

  // Settings panel
  "settings.title": "Settings",
  "settings.theme": "Theme",
  "settings.themeLight": "Light",
  "settings.themeDark": "Dark",
  "settings.themeSystem": "System",
  "settings.panelWidth": "Panel width",
  "settings.widthStandard": "Standard",
  "settings.widthWide": "Wide",
  "settings.behavior": "Panel behavior",
  "settings.pinLabel": "Pin panel (don't auto-hide on blur)",
  "settings.refreshTime": "Daily reset time",
  "settings.saveFailed": "Save failed: {message}",
  "settings.done": "Done",
  "settings.quit": "Quit WarmDock",

  // Ceremony — task-completion flash
  "ceremony.flashTitle": "A promise kept.",
  "ceremony.flashHint": "Tap anywhere to continue",
  // Ceremony — today's close
  "ceremony.allDoneTitle": "Every promise kept today.",
  "ceremony.allDoneSubtitle": "You did it.",
  "ceremony.partialTitle": "Part of today is done.",
  "ceremony.partialSubtitle": "Every step counts — keep going tomorrow.",
  "ceremony.pointsDeferredHint": "Points land in your wallet when tomorrow begins.",
  "ceremony.viewTasks": "View today's tasks",
  // Ceremony — yesterday's recap
  "ceremony.prevFullTitle": "Yesterday, every promise kept.",
  "ceremony.prevFullSubtitle": "Carry that momentum into today.",
  "ceremony.prevPartialTitle": "Yesterday, part of it got done.",
  "ceremony.prevPartialSubtitle": "Every step counts — keep going today.",
  "ceremony.prevEmptyTitle": "No record from yesterday.",
  "ceremony.prevEmptySubtitle": "Today is a fresh start.",
  "ceremony.prevEmptyGoalSubtitle": "Today's a fresh start — try setting a goal.",
  "ceremony.startToday": "Start a new day",
  // Ceremony — stat labels
  "ceremony.statCompleted": "Tasks done",
  "ceremony.statStreak": "Streak",
  "ceremony.statPointsToday": "Today's points",
  "ceremony.statPointsPrev": "Yesterday's points",

  // Unlock tree
  "unlock.title": "Abilities",
  "unlock.available": "{points} available",
  "unlock.close": "Close",
  "unlock.categoryRoot": "Core",
  "unlock.categoryCapacity": "Capacity",
  "unlock.categoryFocus": "Focus",
  "unlock.categoryTime": "Rhythm",
  "unlock.categoryAnalysis": "Analysis",
  "unlock.categoryDefault": "Ability",
  "unlock.stateUnlocked": "Unlocked",
  "unlock.stateDormant": "Dormant",
  "unlock.stateBlocked": "Requirement not met",
  "unlock.statePurchasable": "Available",
  "unlock.stateInsufficient": "Not enough points",
  "unlock.stateAwaiting": "Awaiting awakening",
  "unlock.noRequirement": "No prerequisite",
  "unlock.holdToConfirm": "Hold to confirm unlock",
  "unlock.holdHint": "Hold the node for 2s to unlock",
  "unlock.maximize": "Maximize to center",
  "unlock.restore": "Restore to side",
  "unlock.cost": "Cost {points}",
  "unlock.remainAfterBuy": "{points} left after unlock",
  "unlock.missingPoints": "{points} short",

  // error codes -> messages
  "error.TASK_NOT_FOUND": "That task could not be found",
  "error.TASK_ALREADY_COMPLETED": "This task is already completed",
  "error.TASK_SETUP_INCOMPLETE": "Set the task difficulty first",
  "error.TASK_DETAIL_ALREADY_SET": "Task difficulty is already set and can't be changed",
  "error.UNKNOWN_UNLOCK_NODE": "Unknown unlock node",
  "error.ALREADY_UNLOCKED": "This ability is already unlocked",
  "error.REQUIREMENT_NOT_MET": "The prerequisite isn't met yet",
  "error.INSUFFICIENT_POINTS": "Not enough points",
  "error.INVALID_INPUT": "That input isn't valid",
  "error.NOT_AUTHENTICATED": "You're not signed in",
  "error.CYCLE_SETTLED": "Today is already settled and can't be changed",
  "error.DAY_SETTLED": "Today has ended — new slots are available tomorrow",
  "error.OFFLINE": "You're offline — showing cached data only",
  "error.DB_ERROR": "Something went wrong saving your data",
  "error.UNKNOWN": "An unknown error occurred",

  // Account / deletion
  "account.title": "Account",
  "account.signOut": "Sign out",
  "account.deleteTitle": "Delete account",
  "account.deleteWarning":
    "Deleting signs you out on every device immediately and stops sync. After 30 days your cloud data and local caches are permanently deleted. Sign in again within that window to recover.",
  "account.deleteButton": "Delete my account",
  "account.deleteConfirm": "Confirm delete",
  "account.deleteCancel": "Cancel",
  "account.deleting": "Working…",
  "account.recoverTitle": "Recover account?",
  "account.recoverBody":
    "Your account is in its 30-day deletion grace period. Recover it and keep using WarmDock?",
  "account.recoverButton": "Recover account",
  "account.recovering": "Recovering…",
};

/** English footer mantras — short, warm, no exclamation marks. */
export const MANTRAS_EN: readonly string[] = [
  "One step at a time.",
  "Today doesn't have to be perfect.",
  "A promise is a choice, not a checklist.",
  "Small things count too.",
  "There's still time to go slow.",
  "Every day is a fresh start.",
  "You're already on your way.",
  "Do what you can.",
  "No need to compare to yesterday.",
  "However far you go, keep your direction.",
  "Today is worth remembering.",
  "The pace is your own.",
  "Quietly finishing is enough.",
  "One thing, then the next.",
  "You don't have to carry it all.",
  "You're doing fine today.",
];
