/**
 * 視窗管理單例 — Tauri 視窗 resize/move 的唯一出口。
 * 吸收舊 windowMode.ts 的模組級全域變數與 TriggerBubble 的拖曳細節;
 * store 與元件不再直接碰 @tauri-apps/api/window。
 *
 * 設計:視窗右緣永遠貼螢幕右邊,垂直中心固定在 centerYAnchor,
 * 三種模式只是不同尺寸繞著同一個錨點。
 */

import { invoke } from "@tauri-apps/api/core";
import {
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";

export type WindowMode = "trigger" | "panel" | "configurator";

const nextFrame = () =>
  new Promise<void>((r) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => r());
    } else {
      setTimeout(r, 0);
    }
  });

/** trigger 視覺 28×64,視窗多留 4px 邊距避免 DPI 取整裁切 */
export const TRIGGER_WINDOW_WIDTH = 32;
export const TRIGGER_WINDOW_HEIGHT = 72;
export const PANEL_HEIGHT = 600;
/** panel 視窗寬 = CSS panel 寬 + trigger(28) + 陰影呼吸空間(42) */
export const PANEL_WINDOW_EXTRA = 70;
export const DEFAULT_PANEL_CSS_WIDTH = 320;

type DragSession = {
  startScreenY: number;
  startWindowX: number;
  startWindowY: number;
  windowHeight: number;
  monitorTop: number;
  monitorBottom: number;
};

class WindowManager {
  private centerYAnchor: number | null = null;
  private panelCssWidth = DEFAULT_PANEL_CSS_WIDTH;
  private currentMode: WindowMode = "panel";

  private drag: DragSession | null = null;
  private pendingDragY: number | null = null;
  private dragRaf: number | null = null;

  get mode(): WindowMode {
    return this.currentMode;
  }

  setPanelCssWidth(width: number) {
    this.panelCssWidth = width;
  }

  /** app 啟動時以當前視窗中心當錨點 */
  async init(): Promise<void> {
    const win = getCurrentWindow();
    const pos = await win.outerPosition();
    const size = await win.outerSize();
    this.centerYAnchor = pos.y + size.height / 2;
  }

  /** 用儲存的 trigger_position_y(0~1)還原錨點 */
  async setAnchorFromRatio(ratio: number): Promise<void> {
    const { top, bottom } = await this.monitorVerticalBounds();
    this.centerYAnchor = top + (bottom - top) * ratio;
  }

  /**
   * 主動取得視窗焦點。本視窗是 alwaysOnTop + transparent + skipTaskbar 的浮層,
   * 平常不易持有 OS 焦點;開啟面板/能力配置時主動 setFocus,之後使用者點桌面
   * 才會觸發 onFocusChanged(失焦)→ 自動收合(否則要先手動點一下 app 才有效)。
   */
  async focus(): Promise<void> {
    try {
      await getCurrentWindow().setFocus();
    } catch (e) {
      console.error("focus failed", e);
    }
  }

  async toTrigger(): Promise<void> {
    await this.apply("trigger", TRIGGER_WINDOW_WIDTH, TRIGGER_WINDOW_HEIGHT);
  }

  async toPanel(): Promise<void> {
    await this.apply(
      "panel",
      this.panelCssWidth + PANEL_WINDOW_EXTRA,
      PANEL_HEIGHT
    );
  }

  /**
   * 能力配置開啟時把視窗鋪滿整個螢幕(透明、可穿透由前端 backdrop 控制)。
   * 這樣首頁能留在右側原位,能力配置卡片能在「右側 docked」與「螢幕中央放大」
   * 之間用純 CSS 平滑移動/放大,完全不需要再 resize 視窗(消除閃爍與卡頓)。
   */
  async toFullscreen(): Promise<void> {
    const win = getCurrentWindow();
    const monitor = await currentMonitor();
    if (!monitor) throw new Error("no monitor found");

    if (this.centerYAnchor == null) {
      await this.init();
    }

    const scale = await win.scaleFactor();
    const monitorCssHeight = monitor.size.height / scale;
    const rawAnchorCss =
      ((this.centerYAnchor as number) - monitor.position.y) / scale;
    // clamp 確保面板完整留在螢幕內(半高 + 上下留白 ≈ 300)
    const half = 300;
    const anchorCss = Math.max(
      half,
      Math.min(rawAnchorCss, monitorCssHeight - half)
    );

    // resize + 設錨點變數期間關閉卡片 transition,避免 top/尺寸的瞬間變化
    // 被補間成多餘滑動(放大時 docked 卡片瞬間貼齊新視窗,螢幕位置連續)。
    this.suppressCardTransition(true);
    await invoke("set_window_rect", {
      x: monitor.position.x,
      y: monitor.position.y,
      width: monitor.size.width,
      height: monitor.size.height,
    });
    this.currentMode = "configurator";
    // 視窗鋪滿螢幕後不能再用 top:50%(那會跳到螢幕正中央),把 trigger 錨點
    // 換算成視窗內 CSS 座標,讓首頁/docked 卡片維持在原本的垂直位置。
    this.setAnchorCssVar(anchorCss);
    await this.releaseCardTransition();
  }

  // ── 拖曳(trigger 長按垂直移動) ──

  async beginDrag(startScreenY: number): Promise<void> {
    const win = getCurrentWindow();
    const pos = await win.outerPosition();
    const size = await win.outerSize();
    const { top, bottom } = await this.monitorVerticalBounds();

    this.drag = {
      startScreenY,
      startWindowX: pos.x,
      startWindowY: pos.y,
      windowHeight: size.height,
      monitorTop: top,
      monitorBottom: bottom,
    };
  }

  /** rAF 節流的拖曳跟隨 */
  dragTo(screenY: number): void {
    const drag = this.drag;
    if (!drag) return;

    const rawY = drag.startWindowY + (screenY - drag.startScreenY);
    const maxY = drag.monitorBottom - drag.windowHeight;
    this.pendingDragY = Math.max(drag.monitorTop, Math.min(rawY, maxY));

    if (this.dragRaf != null) return;
    this.dragRaf = requestAnimationFrame(() => {
      this.dragRaf = null;
      const y = this.pendingDragY;
      const session = this.drag;
      if (y == null || !session) return;
      getCurrentWindow()
        .setPosition(new PhysicalPosition(session.startWindowX, Math.round(y)))
        .catch((e) => console.error("dragTo failed", e));
    });
  }

  /** 結束拖曳:同步錨點並回傳新的位置比例(0~1),呼叫端負責存檔 */
  async endDrag(): Promise<number | null> {
    if (!this.drag) return null;
    if (this.dragRaf != null) {
      cancelAnimationFrame(this.dragRaf);
      this.dragRaf = null;
    }
    const { monitorTop, monitorBottom } = this.drag;
    this.drag = null;
    this.pendingDragY = null;

    const win = getCurrentWindow();
    const pos = await win.outerPosition();
    const size = await win.outerSize();
    this.centerYAnchor = pos.y + size.height / 2;

    const ratio =
      (this.centerYAnchor - monitorTop) / (monitorBottom - monitorTop);
    return Math.max(0, Math.min(ratio, 1));
  }

  get isDragging(): boolean {
    return this.drag !== null;
  }

  /** 結束應用程式(單一視窗,關閉即離開) */
  async quitApp(): Promise<void> {
    await getCurrentWindow().close();
  }

  // ── internal ──

  /**
   * 幾何/錨點變更期間,直接在 documentElement 掛 class 關閉卡片 transition。
   * 用 class(而非 React 狀態)是為了與 setAnchorCssVar 的 DOM 操作原子化,
   * 不受 React commit 時機影響。
   */
  private suppressCardTransition(on: boolean): void {
    document.documentElement.classList.toggle("wd-card-instant", on);
  }

  /**
   * 恢復卡片 transition。等兩帧:第一帧 paint「瞬間套用」後的最終位置,
   * 第二帧才移除 class,確保 transition 恢復與位置變更不在同一次 paint
   * (否則瀏覽器仍會把這次位置變化補間成滑動)。
   */
  private async releaseCardTransition(): Promise<void> {
    await nextFrame();
    await nextFrame();
    this.suppressCardTransition(false);
  }

  /**
   * 設定/清除首頁與能力配置卡片定位用的錨點 CSS 變數。
   * null = 移除變數,CSS 退回 top:50%(視窗已對齊錨點的 panel/trigger 模式)。
   */
  private setAnchorCssVar(cssY: number | null): void {
    const root = document.documentElement;
    if (cssY == null) {
      root.style.removeProperty("--wd-anchor-y");
    } else {
      root.style.setProperty("--wd-anchor-y", `${Math.round(cssY)}px`);
    }
  }

  private async monitorVerticalBounds(): Promise<{
    top: number;
    bottom: number;
  }> {
    const monitor = await currentMonitor();
    if (!monitor) throw new Error("no monitor found");
    return {
      top: monitor.position.y,
      bottom: monitor.position.y + monitor.size.height,
    };
  }

  private async apply(
    mode: WindowMode,
    cssWidth: number,
    cssHeight: number
  ): Promise<void> {
    const win = getCurrentWindow();

    if (this.centerYAnchor == null) {
      await this.init();
    }

    const scale = await win.scaleFactor();
    const physicalWidth = Math.round(cssWidth * scale);
    const physicalHeight = Math.round(cssHeight * scale);

    const monitor = await currentMonitor();
    if (!monitor) throw new Error("no monitor found");
    const screenRight = monitor.position.x + monitor.size.width;
    const screenTop = monitor.position.y;
    const screenBottom = monitor.position.y + monitor.size.height;

    const newX = screenRight - physicalWidth;
    // clamp 垂直位置,確保視窗永遠完整留在螢幕內
    // (避免使用者把配置器拖到很低後,面板/設定內容溢出底部)
    const rawY = Math.round(
      (this.centerYAnchor as number) - physicalHeight / 2
    );
    const maxY = screenBottom - physicalHeight;
    const newY = Math.max(screenTop, Math.min(rawY, maxY));

    // resize + 清錨點變數期間關閉卡片 transition(同 toFullscreen),
    // 否則縮窗清變數造成的 top 變化會被補間成「縮窗後又滑一次」的卡頓。
    this.suppressCardTransition(true);
    // Rust 端一次完成移位 + 縮放,消滅兩次 IPC 之間的閃爍
    await invoke("set_window_rect", {
      x: newX,
      y: newY,
      width: physicalWidth,
      height: physicalHeight,
    });
    this.currentMode = mode;

    // 視窗縮回後才清錨點變數:此時 panel 視窗已對齊錨點置中,top:50% 即等於
    // 錨點,清變數不會造成位置跳動(若在 resize 前清,鋪滿視窗下 50% 會是
    // 螢幕中央,卡片/首頁會先瞬移到中央再縮窗)。
    this.setAnchorCssVar(null);
    await this.releaseCardTransition();
  }
}

export const windowManager = new WindowManager();
