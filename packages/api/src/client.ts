import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import type { Gateways } from "./ports";
import {
  createSessionGateway,
  createSettingsGateway,
  createTaskGateway,
  createUnlockGateway,
} from "./gateways";
import { createAuthGateway } from "./auth";
import { createRealtimeGateway } from "./realtime";
import { createAiGateway } from "./ai";

export interface WarmDockClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Platform auth storage/persistence overrides (web localStorage, Expo SecureStore, etc.). */
  auth?: SupabaseClientOptions<"public">["auth"];
}

export interface WarmDockClient extends Gateways {
  supabase: SupabaseClient;
}

/**
 * Assemble the WarmDock cloud client: one authenticated Supabase client plus all
 * gateways. Compiled into Web, Desktop, and Mobile — it is a client library, not
 * a server.
 */
export function createWarmDockClient(config: WarmDockClientConfig): WarmDockClient {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      ...config.auth,
    },
  });

  return {
    supabase,
    task: createTaskGateway(supabase),
    session: createSessionGateway(supabase),
    unlock: createUnlockGateway(supabase),
    settings: createSettingsGateway(supabase),
    auth: createAuthGateway(supabase),
    realtime: createRealtimeGateway(supabase),
    ai: createAiGateway(supabase),
  };
}
