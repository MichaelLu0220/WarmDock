/**
 * No-op on web. On desktop this hides the floating panel when the window loses
 * focus; the web panel lives in the page, so there is nothing to auto-hide.
 */
export function useAutoHide(): void {
  /* intentionally empty */
}
