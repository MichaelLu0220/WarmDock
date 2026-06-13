"use client";

import { createWarmDockClient, type WarmDockClient } from "@warmdock/api";

let client: WarmDockClient | null = null;

/** Singleton browser client (persists the session in localStorage). */
export function getWarmDockClient(): WarmDockClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)"
    );
  }

  client = createWarmDockClient({
    supabaseUrl: url,
    supabaseKey: key,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
