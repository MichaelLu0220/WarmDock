/**
 * 視窗開關流程:windowManager(實體視窗)與 uiStore(CSS 動畫旗標)的協調。
 * 開:先放大視窗再滑入;關:先滑出,等動畫結束再縮窗。
 */

import { DUR_PANEL } from "../../ui/motion";
import { useUIStore } from "../stores/uiStore";
import { windowManager } from "../window/windowManager";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function openPanel(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setWindowTransitioning(true);
  try {
    await windowManager.toPanel();
    useUIStore.getState().setPanelOpen(true);
    // 取得焦點,讓之後點視窗外(桌面)能觸發失焦自動收合
    void windowManager.focus();
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
}

export async function closePanel(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setWindowTransitioning(true);
  ui.setPanelOpen(false);
  try {
    await delay(DUR_PANEL + 40);
    // 等待期間使用者可能又打開了 panel(快速連點),此時不要縮窗
    if (!useUIStore.getState().isPanelOpen) {
      await windowManager.toTrigger();
    }
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
}

export async function togglePanel(): Promise<void> {
  if (useUIStore.getState().isPanelOpen) {
    await closePanel();
  } else {
    await openPanel();
  }
}

/**
 * 開啟能力配置(docked):視窗維持原本的 panel 尺寸,不鋪滿螢幕。
 * 能力配置卡片從右側書脊翻入,以與首頁相同的尺寸覆蓋在首頁上(翻到下一頁)。
 * 只有之後按「放大」鈕才會把視窗鋪滿螢幕。
 * (面板此時必為開啟狀態,視窗已是 panel 尺寸,故開啟不需 resize,零閃爍)
 */
export function openUnlockTree(): void {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  ui.setUnlockTreeOpen(true);
  // 確保視窗持有焦點,之後點桌面才會失焦 → 整個收成泡泡
  // (否則要先手動點一下 app 視窗才有效)
  void windowManager.focus();
}

/**
 * 關閉能力配置:
 * 1. 先播書脊翻出動畫(卡片保留掛載,不論 docked 或 centered 都從原位翻出)。
 * 2. 動畫結束後才卸載卡片。
 * 3. 若曾放大(視窗已鋪滿)才把視窗縮回 panel 尺寸(卡片已卸載,瞬間縮回)。
 */
export async function closeUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  if (ui.isUnlockTreeClosing) return; // 防止關閉動畫期間重入

  ui.setUnlockTreeClosing(true);
  await delay(DUR_PANEL);

  const u = useUIStore.getState();
  u.setUnlockTreeOpen(false);
  u.setUnlockTreeClosing(false);
  u.setUnlockMaximized(false);

  if (windowManager.mode === "configurator") {
    // 放大態關閉:視窗仍鋪滿,翻出動畫期間保持 expanded(trigger 隱藏),
    // 等縮回 panel 後才放行 trigger。
    u.setWindowTransitioning(true);
    try {
      await windowManager.toPanel();
    } finally {
      const u2 = useUIStore.getState();
      u2.setUnlockExpanded(false);
      u2.setWindowTransitioning(false);
    }
  } else {
    u.setUnlockExpanded(false);
  }
}

/**
 * 從第二頁面(docked)直接收合成右緣泡泡:不播翻出動畫,把能力配置整個收掉,
 * 再把面板翻書收合、視窗縮成 trigger。供右緣 trigger 在第二頁面開啟時點擊用。
 */
export async function collapsePanelFromUnlock(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockTreeOpen(false);
  ui.setUnlockTreeClosing(false);
  ui.setUnlockMaximized(false);
  ui.setUnlockExpanded(false);
  await closePanel();
}

const nextFrame = () =>
  new Promise<void>((r) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => r());
    } else {
      setTimeout(r, 0);
    }
  });

/**
 * 放大:
 * 1. 把視窗鋪滿螢幕(windowManager.toFullscreen 在 resize 期間自我抑制卡片
 *    transition,docked 卡片瞬間貼齊新視窗,螢幕位置連續、不會先滑一下)。
 * 2. 下一帧才翻到 centered —— 純 CSS 把卡片從右側飛到中央放大,首頁留右側原位。
 */
export async function maximizeUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  // 視窗即將鋪滿 → 先收起右緣 trigger(否則它會被 top:50% 定位到螢幕中央)。
  ui.setUnlockExpanded(true);
  ui.setWindowTransitioning(true);
  try {
    await windowManager.toFullscreen();
  } finally {
    useUIStore.getState().setWindowTransitioning(false);
  }
  await nextFrame();
  if (useUIStore.getState().isUnlockTreeOpen) {
    useUIStore.getState().setUnlockMaximized(true);
  }
}

/**
 * 縮回:
 * 1. 純 CSS 把卡片從中央動畫滑回右側 docked(視窗仍鋪滿)。
 * 2. 動畫結束後才縮視窗(windowManager.toPanel 在 resize + 清錨點變數期間自我
 *    抑制卡片 transition,並等瞬間狀態 paint 後才恢復,因此不會縮窗後又滑一次)。
 */
export async function restoreUnlockTree(): Promise<void> {
  const ui = useUIStore.getState();
  ui.setUnlockMaximized(false);
  await delay(DUR_PANEL + 40);
  // 等待期間使用者可能又按了放大,此時不要縮窗
  if (useUIStore.getState().isUnlockMaximized) return;
  ui.setWindowTransitioning(true);
  try {
    await windowManager.toPanel();
  } finally {
    const u = useUIStore.getState();
    // 視窗已縮回 panel → 放行右緣 trigger(回到 docked 第二頁面)。
    u.setUnlockExpanded(false);
    u.setWindowTransitioning(false);
  }
}

/** 結束 WarmDock */
export async function quitApp(): Promise<void> {
  await windowManager.quitApp();
}
