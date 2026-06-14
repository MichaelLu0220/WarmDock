import { useState, type FormEvent } from "react";
import { getClient } from "../lib/client";

function message(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  margin: "6px 0",
  border: "1px solid var(--wd-line, #c9bfa6)",
  borderRadius: 6,
};

/** Desktop sign-in: email OTP + 13+ confirmation. (zh-TW UI.) */
export function SignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!ageOk) {
      setError("請先確認你已滿 13 歲。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await getClient().auth.signInWithEmailOtp(email);
      setSent(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // App's onAuthStateChange swaps to the panel on success.
      await getClient().auth.verifyEmailOtp(email, otp.trim());
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "20px 18px" }}>
      <h2 style={{ margin: "0 0 12px" }}>登入 WarmDock</h2>
      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "10px 0" }}>
        <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} />
        我已滿 13 歲
      </label>

      {!sent ? (
        <form onSubmit={send}>
          <input
            style={inputStyle}
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="wd-btn" type="submit" disabled={busy || !ageOk}>
            寄送登入碼
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p style={{ fontSize: 13 }}>登入碼已寄到 {email}</p>
          <input
            style={inputStyle}
            inputMode="numeric"
            required
            placeholder="6 位數登入碼"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="wd-btn" type="submit" disabled={busy}>
            驗證並登入
          </button>
        </form>
      )}

      {error && <p style={{ color: "#b3402f", marginTop: 10, fontSize: 13 }}>{error}</p>}
    </div>
  );
}
