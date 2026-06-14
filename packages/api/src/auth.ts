import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@warmdock/core";
import { mapPostgrestError } from "./errors";
import type { AuthGateway } from "./ports";

export function createAuthGateway(sb: SupabaseClient): AuthGateway {
  return {
    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session;
    },
    onAuthStateChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session));
      return () => data.subscription.unsubscribe();
    },
    async signInWithGoogle(redirectTo) {
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) throw new AppError("UNKNOWN", error.message);
    },
    async signInWithEmailOtp(email) {
      const { error } = await sb.auth.signInWithOtp({ email });
      if (error) throw new AppError("UNKNOWN", error.message);
    },
    async verifyEmailOtp(email, token) {
      const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
      if (error || !data.session) {
        throw new AppError("UNKNOWN", error?.message ?? "OTP verification failed");
      }
      return data.session;
    },
    async signOut() {
      const { error } = await sb.auth.signOut();
      if (error) throw new AppError("UNKNOWN", error.message);
    },
    async requestAccountDeletion() {
      const { error } = await sb.rpc("request_account_deletion");
      const mapped = mapPostgrestError(error);
      if (mapped) throw mapped;
    },
    async recoverAccount() {
      const { error } = await sb.rpc("recover_account");
      const mapped = mapPostgrestError(error);
      if (mapped) throw mapped;
    },
  };
}

