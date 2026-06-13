/**
 * Integration test: exercises the whole gateway surface against a running local
 * Supabase stack. Gated on SUPABASE_SERVICE_ROLE_KEY so a normal `pnpm test`
 * (no stack) skips it.
 *
 * Run locally:
 *   pnpm supabase start
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_PUBLISHABLE_KEY=<publishable> \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role> \
 *   pnpm --filter @warmdock/api exec vitest run src/integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { AppError } from "@warmdock/core";
import { createWarmDockClient, type WarmDockClient } from "./client";

// Node < 22 has no global WebSocket; supabase-js initializes Realtime eagerly.
// Browser / Expo / Tauri webview all provide WebSocket natively — test-only shim.
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

describe.skipIf(!SERVICE || !PUBLISHABLE)("packages/api against local Supabase", () => {
  let admin: SupabaseClient;
  let wd: WarmDockClient;
  let userId: string;
  const email = `it-${Date.now()}@warmdock.test`;
  const password = "test-password-123456";

  beforeAll(async () => {
    admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user!.id;

    wd = createWarmDockClient({
      supabaseUrl: URL,
      supabaseKey: PUBLISHABLE,
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signedIn = await wd.supabase.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
  });

  afterAll(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("bootstraps an empty account (trigger-provisioned profile + wallet)", async () => {
    const snap = await wd.session.bootstrap();
    expect(snap.tasks).toHaveLength(0);
    expect(snap.wallet.walletPoints).toBe(0);
    expect(snap.profile.userId).toBe(userId);
    expect(snap.unlocks.maxVisibleTaskSlots).toBe(3);
  });

  it("runs the full task lifecycle and idempotent create", async () => {
    const req = crypto.randomUUID();
    const created = await wd.task.create("write an integration test", req, "UTC");
    expect(created.status).toBe("draft");

    // same client_request_id returns the same task
    const dup = await wd.task.create("ignored", req, "UTC");
    expect(dup.id).toBe(created.id);

    const ready = await wd.task.setDetail(created.id, {
      difficulty: 3,
      difficultySuggested: "medium",
      isFocus: true,
    });
    expect(ready.status).toBe("ready");
    expect(ready.finalRewardPoints).toBe(4);

    const result = await wd.task.complete(created.id);
    expect(result.rewardEarned).toBe(3);
    expect(result.bonusEarned).toBe(1);
    expect(result.pendingTodayPoints).toBe(4);
  });

  it("rejects an invalid transition with a typed AppError", async () => {
    const tasks = await wd.task.listToday();
    const completed = tasks.find((t) => t.status === "completed");
    expect(completed).toBeDefined();
    await expect(wd.task.complete(completed!.id)).rejects.toMatchObject({
      code: "TASK_ALREADY_COMPLETED",
    });
  });

  it("purchases an affordable node and rejects an unaffordable one", async () => {
    // available points = 4 (pending). root.awaken costs 0.
    const purchased = await wd.unlock.purchase("root.awaken");
    expect(purchased.nodeId).toBe("root.awaken");

    await expect(wd.unlock.purchase("slots.4")).rejects.toMatchObject({
      code: "INSUFFICIENT_POINTS",
    });

    const progress = await wd.unlock.progress();
    const root = progress.nodes.find((n) => n.nodeId === "root.awaken");
    expect(root?.unlocked).toBe(true);
  });

  it("updates non-authoritative preferences via RLS", async () => {
    const profile = await wd.settings.updatePreferences({
      reminderIntensity: "low",
      aiImprovementOptOut: true,
    });
    expect(profile.reminderIntensity).toBe("low");
    expect(profile.aiImprovementOptOut).toBe(true);
  });

  it("returns the medium/3 fallback when the AI edge function is absent", async () => {
    const analysis = await wd.ai.analyzeTaskProposal("by mistaek");
    expect(analysis.available).toBe(false);
    expect(analysis.suggestedBand).toBe("medium");
    expect(analysis.suggestedScore).toBe(3);
    expect(analysis.originalText).toBe("by mistaek");
  });

  it("imports AppError from core for error typing", () => {
    expect(new AppError("UNKNOWN", "x")).toBeInstanceOf(Error);
  });
});
