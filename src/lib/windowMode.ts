import {
  getCurrentWindow,
  currentMonitor,
  PhysicalSize,
  PhysicalPosition,
} from "@tauri-apps/api/window";

export const TRIGGER_WIDTH = 28;
export const TRIGGER_HEIGHT = 64;

export const PANEL_WIDTH = 390;
export const PANEL_HEIGHT = 600;

export const CONFIGURATOR_WIDTH = 680;
export const CONFIGURATOR_HEIGHT = 600;

// 👉 錨點
let centerYAnchor: number | null = null;

/**
 * 初始化錨點（只會抓一次）
 * 👉 以「當前視窗」當作最大視窗來定義中心
 */
export async function initWindowAnchor() {
  const win = getCurrentWindow();

  const pos = await win.outerPosition(); // physical
  const size = await win.outerSize();    // physical

  centerYAnchor = pos.y + size.height / 2;
}

/**
 * 取得螢幕右邊界 function
 */
async function getScreenRightEdge() {
  const monitor = await currentMonitor();

  if (!monitor) {
    throw new Error("No monitor found");
  }

  return monitor.position.x + monitor.size.width;
}

/**
 * 切換模式（核心邏輯）
 */
async function applyMode(width: number, height: number) {
  const win = getCurrentWindow();

  // 👉 如果沒初始化過，就用當前視窗當基準
  if (centerYAnchor == null) {
    const pos = await win.outerPosition();
    const size = await win.outerSize();
    centerYAnchor = pos.y + size.height / 2;
  }

  const scale = await win.scaleFactor();

  const physicalWidth = Math.round(width * scale);
  const physicalHeight = Math.round(height * scale);

  // 👉 核心：右邊固定 + 中心固定
  const screenRight = await getScreenRightEdge();
  const newX = screenRight - physicalWidth;
  const newY = Math.round(centerYAnchor - physicalHeight / 2);

  /*console.log("applyMode", {
    rightEdgeAnchor,
    centerYAnchor,
    physicalWidth,
    physicalHeight,
    newX,
    newY,
  });*/

  await win.setSize(new PhysicalSize(physicalWidth, physicalHeight));
  await win.setPosition(new PhysicalPosition(newX, newY));
}



/**
 * 三種模式
 */
export async function enterPanelMode() {
  await applyMode(PANEL_WIDTH, PANEL_HEIGHT);
}

export async function enterTriggerMode() {
  await applyMode(TRIGGER_WIDTH, TRIGGER_HEIGHT);
}

export async function enterConfiguratorMode() {
  await applyMode(CONFIGURATOR_WIDTH, CONFIGURATOR_HEIGHT);
}

// 👇 拖曳用：取得螢幕上下邊界
export async function getMonitorVerticalBounds() {
  const monitor = await currentMonitor();
  if (!monitor) throw new Error("No monitor");

  return {
    top: monitor.position.y,
    bottom: monitor.position.y + monitor.size.height,
  };
}

// 👇 拖曳用：直接移動 window 的 topY
export async function moveWindowToTopY(topY: number) {
  const win = getCurrentWindow();
  const pos = await win.outerPosition();

  await win.setPosition(new PhysicalPosition(pos.x, Math.round(topY)));
}

// 👇 拖完更新中心 anchor（超重要）
export async function syncCenterAnchorFromCurrentWindow() {
  const win = getCurrentWindow();
  const pos = await win.outerPosition();
  const size = await win.outerSize();

  centerYAnchor = pos.y + size.height / 2;
}

export function setCenterYAnchor(centerY: number) {
  centerYAnchor = centerY;
}

export function getCenterYAnchor() {
  return centerYAnchor;
}