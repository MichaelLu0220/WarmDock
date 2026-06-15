import AsyncStorage from "@react-native-async-storage/async-storage";
import { createWarmDockClient, type WarmDockClient } from "@warmdock/api";

const env = process.env as Record<string, string | undefined>;
// NOTE for local dev: iOS simulator can reach 127.0.0.1; Android emulator uses
// 10.0.2.2; a physical device needs your machine's LAN IP. Override with
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

let client: WarmDockClient | null = null;

export function getClient(): WarmDockClient {
  if (!client) {
    client = createWarmDockClient({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
