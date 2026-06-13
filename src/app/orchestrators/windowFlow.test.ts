import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const windowManagerMock = vi.hoisted(() => ({
  mode: "panel" as "panel" | "trigger" | "configurator",
  toFullscreen: vi.fn(),
  toPanel: vi.fn(),
  toTrigger: vi.fn(),
  quitApp: vi.fn(),
}));

vi.mock("../window/windowManager", () => ({
  windowManager: windowManagerMock,
}));

import { useUIStore } from "../stores/uiStore";
import {
  closePanel,
  closeUnlockTree,
  maximizeUnlockTree,
  openPanel,
  openUnlockTree,
} from "./windowFlow";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function transitionState(): boolean | undefined {
  return useUIStore.getState().isWindowTransitioning;
}

beforeEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  windowManagerMock.mode = "panel";
  useUIStore.setState({
    isPanelOpen: true,
    isWindowTransitioning: false,
    isUnlockTreeOpen: false,
    isUnlockTreeClosing: false,
    isUnlockMaximized: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("panel window flow", () => {
  it("keeps trigger gated while the native window expands", async () => {
    useUIStore.setState({ isPanelOpen: false });
    const resize = deferred();
    windowManagerMock.toPanel.mockReturnValue(resize.promise);

    const opening = openPanel();

    expect(transitionState()).toBe(true);
    expect(useUIStore.getState().isPanelOpen).toBe(false);

    resize.resolve();
    await opening;

    expect(useUIStore.getState().isPanelOpen).toBe(true);
    expect(transitionState()).toBe(false);
  });

  it("keeps trigger gated until the collapsed panel finishes shrinking", async () => {
    vi.useFakeTimers();
    const resize = deferred();
    windowManagerMock.toTrigger.mockReturnValue(resize.promise);

    const closing = closePanel();

    expect(transitionState()).toBe(true);
    expect(useUIStore.getState().isPanelOpen).toBe(false);

    await vi.advanceTimersByTimeAsync(560);
    expect(windowManagerMock.toTrigger).toHaveBeenCalledOnce();
    expect(transitionState()).toBe(true);

    resize.resolve();
    await closing;

    expect(transitionState()).toBe(false);
  });
});

describe("unlock window flow", () => {
  it("opens docked without resizing the native window", () => {
    openUnlockTree();

    expect(useUIStore.getState().isUnlockTreeOpen).toBe(true);
    expect(useUIStore.getState().isUnlockMaximized).toBe(false);
    expect(windowManagerMock.toFullscreen).not.toHaveBeenCalled();
    expect(transitionState()).toBe(false);
  });

  it("gates trigger while maximizing expands the window to fullscreen", async () => {
    useUIStore.setState({ isUnlockTreeOpen: true });
    const resize = deferred();
    windowManagerMock.toFullscreen.mockReturnValue(resize.promise);

    const maximizing = maximizeUnlockTree();

    expect(transitionState()).toBe(true);
    expect(useUIStore.getState().isUnlockMaximized).toBe(false);

    resize.resolve();
    await maximizing;

    expect(useUIStore.getState().isUnlockMaximized).toBe(true);
    expect(transitionState()).toBe(false);
  });

  it("plays the flip-out then shrinks the window when closing after maximize", async () => {
    vi.useFakeTimers();
    useUIStore.setState({ isUnlockTreeOpen: true, isUnlockMaximized: true });
    windowManagerMock.mode = "configurator";
    const resize = deferred();
    windowManagerMock.toPanel.mockReturnValue(resize.promise);

    const closing = closeUnlockTree();

    // 立刻進入翻出動畫,卡片仍掛載
    expect(useUIStore.getState().isUnlockTreeClosing).toBe(true);
    expect(useUIStore.getState().isUnlockTreeOpen).toBe(true);
    expect(windowManagerMock.toPanel).not.toHaveBeenCalled();

    // 翻出動畫結束 → 卸載 + 開始縮窗
    await vi.advanceTimersByTimeAsync(540);
    expect(useUIStore.getState().isUnlockTreeOpen).toBe(false);
    expect(useUIStore.getState().isUnlockTreeClosing).toBe(false);
    expect(useUIStore.getState().isUnlockMaximized).toBe(false);
    expect(windowManagerMock.toPanel).toHaveBeenCalledOnce();
    expect(transitionState()).toBe(true);

    resize.resolve();
    await closing;
    expect(transitionState()).toBe(false);
  });

  it("plays the flip-out and unmounts without resizing when docked", async () => {
    vi.useFakeTimers();
    useUIStore.setState({ isUnlockTreeOpen: true, isUnlockMaximized: false });
    windowManagerMock.mode = "panel";

    const closing = closeUnlockTree();

    expect(useUIStore.getState().isUnlockTreeClosing).toBe(true);
    expect(useUIStore.getState().isUnlockTreeOpen).toBe(true);

    await vi.advanceTimersByTimeAsync(540);
    await closing;

    expect(useUIStore.getState().isUnlockTreeOpen).toBe(false);
    expect(useUIStore.getState().isUnlockTreeClosing).toBe(false);
    expect(windowManagerMock.toPanel).not.toHaveBeenCalled();
    expect(transitionState()).toBe(false);
  });
});
