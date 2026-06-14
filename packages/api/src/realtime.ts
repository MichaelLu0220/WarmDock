import type { SupabaseClient } from "@supabase/supabase-js";
import type { RealtimeGateway } from "./ports";

/**
 * Subscribe to authoritative row changes via Postgres Changes. Table RLS is the
 * security boundary; the user_id filter only reduces traffic. Clients react to a
 * change event by refetching authoritative state (and showing "Updated from
 * another device").
 */
export function createRealtimeGateway(sb: SupabaseClient): RealtimeGateway {
  return {
    subscribe(userId, handlers) {
      const filter = `user_id=eq.${userId}`;
      const channel = sb
        .channel(`warmdock:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter }, () =>
          handlers.onChange("task")
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter }, () =>
          handlers.onChange("wallet")
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "cycles", filter }, () =>
          handlers.onChange("cycle")
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter }, () =>
          handlers.onChange("profile")
        )
        .subscribe((status) => {
          // SUBSCRIBED = connected; CHANNEL_ERROR / TIMED_OUT / CLOSED = disconnected.
          handlers.onConnectionChange?.(status === "SUBSCRIBED");
        });

      return () => {
        void sb.removeChannel(channel);
      };
    },
  };
}
