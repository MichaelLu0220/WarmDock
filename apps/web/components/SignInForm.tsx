"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getWarmDockClient } from "../lib/supabaseClient";

function message(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

export function SignInForm() {
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
    <div className="wd-web-auth">
      <h1>Sign in to WarmDock</h1>

      <label className="wd-web-age">
        <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} />
        I am 13 or older
      </label>

      <button className="wd-web-btn" onClick={google} disabled={busy || !ageOk}>
        Continue with Google
      </button>

      <div className="wd-web-divider">or</div>

      {!sent ? (
        <form onSubmit={sendOtp}>
          <input
            className="wd-web-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="wd-web-btn" type="submit" disabled={busy || !ageOk}>
            Email me a sign-in code
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p>We sent a code to {email}.</p>
          <input
            className="wd-web-input"
            inputMode="numeric"
            required
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="wd-web-btn" type="submit" disabled={busy}>
            Verify &amp; continue
          </button>
        </form>
      )}

      {error && <p className="wd-web-error">{error}</p>}
    </div>
  );
}
