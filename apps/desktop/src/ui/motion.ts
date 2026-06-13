/**
 * 動畫時長/緩動的唯一來源。
 * main.tsx 啟動時把這些注入成 CSS 變數,CSS 與 TS 永遠同步,
 * 不再出現「CSS 220ms、JS setTimeout 220 各寫一份」的魔數。
 */

export const DUR_FAST = 120; // hover、小元件回饋
export const DUR_BASE = 220; // 一般出入場
export const DUR_PANEL = 520; // panel 翻書開合
export const DUR_CEREMONY = 480; // ceremony 進場

/** 平滑位移用(輕微 overshoot 的 ease-out) */
export const EASE_SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
/** 快速回彈用 */
export const EASE_SNAP = "cubic-bezier(0.5, 0, 0.5, 1)";

/** 任務完成卡片動畫(steps),TaskCard 等它跑完才跳 flash/ceremony */
export const DUR_TASK_COMPLETE = 420;

export function injectMotionVars() {
  const root = document.documentElement.style;
  root.setProperty("--wd-dur-fast", `${DUR_FAST}ms`);
  root.setProperty("--wd-dur-base", `${DUR_BASE}ms`);
  root.setProperty("--wd-dur-panel", `${DUR_PANEL}ms`);
  root.setProperty("--wd-dur-ceremony", `${DUR_CEREMONY}ms`);
  root.setProperty("--wd-ease-smooth", EASE_SMOOTH);
  root.setProperty("--wd-ease-snap", EASE_SNAP);
}
