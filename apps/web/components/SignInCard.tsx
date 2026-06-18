"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getWarmDockClient } from "../lib/supabaseClient";

function message(err: unknown): string {
  if (err && typeof err === "object" && "message" in err)
    return String((err as { message: unknown }).message);
  return String(err);
}

/**
 * 登入字卡本體(邏輯 + 卡片 UI)。兩處共用:
 *  - /sign-in 整頁(SignInForm 包一層全頁外框)
 *  - 首頁置中 modal(SignInModal),由 nav / Hero / Final CTA 的 Sign in 開啟
 * 傳入 onClose 時右上角顯示關閉鈕(modal 情境)。
 */
export function SignInCard({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (!ageOk) {
      setError("Please confirm you are 13 or older.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await getWarmDockClient().auth.signInWithEmailOtp(email);
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
      await getWarmDockClient().auth.verifyEmailOtp(email, otp.trim());
      router.replace("/app");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!ageOk) {
      setError("Please confirm you are 13 or older.");
      return;
    }
    setError(null);
    try {
      await getWarmDockClient().auth.signInWithGoogle(`${window.location.origin}/app`);
    } catch (err) {
      setError(message(err));
    }
  }

  return (
    <section className="wd-auth-card">
      {onClose && (
        <button className="wd-auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
      <span className="wd-auth-brand">WarmDock</span>
      <h1 className="wd-auth-title">Sign in</h1>
      <p className="wd-auth-sub">Pick up today&apos;s promises where you left off.</p>

      <label className="wd-auth-age">
        <input
          type="checkbox"
          checked={ageOk}
          onChange={(e) => setAgeOk(e.target.checked)}
        />
        <span>I am 13 or older</span>
      </label>

      <button className="wd-btn block ghost" onClick={google} disabled={busy || !ageOk}>
        Continue with Google
      </button>

      <div className="wd-auth-divider">
        <span>or</span>
      </div>

      {!sent ? (
        <form className="wd-auth-form" onSubmit={sendOtp}>
          <input
            className="wd-auth-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="wd-btn block" type="submit" disabled={busy || !ageOk}>
            {busy ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      ) : (
        <form className="wd-auth-form" onSubmit={verify}>
          <p className="wd-auth-note">
            We sent a code to <strong>{email}</strong>.
          </p>
          <input
            className="wd-auth-input"
            inputMode="numeric"
            required
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="wd-btn block" type="submit" disabled={busy}>
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            className="wd-auth-link"
            onClick={() => {
              setSent(false);
              setOtp("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      {error && <p className="wd-auth-error">{error}</p>}
    </section>
  );
}
