import { describe, expect, it } from "vitest";
import { getAutoHideAction } from "./autoHidePolicy";

const baseState = {
  isPanelOpen: true,
  isWindowTransitioning: false,
  isTaskDetailOpen: false,
  isUnlockTreeOpen: false,
  isUnlockMaximized: false,
  isSettingsOpen: false,
  isComposingTask: false,
};

describe("getAutoHideAction", () => {
  it("closes a docked unlock tree when unpinned", () => {
    expect(
      getAutoHideAction({
        ...baseState,
        isUnlockTreeOpen: true,
        pinEnabled: false,
      })
    ).toBe("unlock");
  });

  it("keeps the unlock tree open when pinned", () => {
    expect(
      getAutoHideAction({
        ...baseState,
        isUnlockTreeOpen: true,
        pinEnabled: true,
      })
    ).toBe("none");
  });

  it("keeps a maximized unlock tree open", () => {
    expect(
      getAutoHideAction({
        ...baseState,
        isUnlockTreeOpen: true,
        isUnlockMaximized: true,
        pinEnabled: false,
      })
    ).toBe("none");
  });

  it("closes an ordinary unpinned panel", () => {
    expect(getAutoHideAction({ ...baseState, pinEnabled: false })).toBe(
      "panel"
    );
  });

  it("keeps panels open while modal or composition state is active", () => {
    expect(
      getAutoHideAction({
        ...baseState,
        isTaskDetailOpen: true,
        pinEnabled: false,
      })
    ).toBe("none");
    expect(
      getAutoHideAction({
        ...baseState,
        isSettingsOpen: true,
        pinEnabled: false,
      })
    ).toBe("none");
    expect(
      getAutoHideAction({
        ...baseState,
        isComposingTask: true,
        pinEnabled: false,
      })
    ).toBe("none");
  });

  it("ignores focus changes during a native window transition", () => {
    expect(
      getAutoHideAction({
        ...baseState,
        isWindowTransitioning: true,
        pinEnabled: false,
      })
    ).toBe("none");
  });
});
