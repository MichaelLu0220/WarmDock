import { createWarmDockClient, type WarmDockClient } from "@warmdock/api";

const env = import.meta.env as Record<string, string | undefined>;
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY =
  env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

let client: WarmDockClient | null = null;

/** Singleton cloud client. The WebView2 runtime persists the session in localStorage. */
export function getClient(): WarmDockClient {
  if (!client) {
    client = createWarmDockClient({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
