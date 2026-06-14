import { useUIStore } from "@warmdock/ui-web";
import { getClient } from "../lib/client";

const style: React.CSSProperties = {
  position: "fixed",
  top: 10,
  left: 10,
  zIndex: 50,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--wd-line, #c9bfa6)",
  background: "var(--wd-paper, #f4ecd8)",
  color: "var(--wd-ink-soft, #5b5240)",
  fontSize: 12,
  cursor: "pointer",
  opacity: 0.85,
};

/**
 * Desktop sign-out. Logging out keeps the encrypted cache (only the same account
 * can read it again); App's onAuthStateChange swaps back to the sign-in screen.
 * Shown only while the panel is open.
 */
export function SignOutButton() {
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  if (!isPanelOpen) return null;

  async function signOut() {
    await getClient().auth.signOut();
  }

  return (
    <button type="button" style={style} onClick={signOut}>
      登出
    </button>
  );
}
