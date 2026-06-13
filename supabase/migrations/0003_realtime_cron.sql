-- WarmDock realtime + scheduled settlement (Phase 1)
--
-- Realtime: clients fetch authoritative state on startup, then subscribe to
-- Postgres Changes (the desktop runDailyRefreshIfNeeded polling is retired).
-- Table RLS remains the security boundary; client-side user_id filters only
-- reduce traffic and are not treated as authorization.
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.cycles;
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.profiles;

-- Scheduled settlement: settle every overdue open cycle once a minute. Mutation
-- RPCs also reconcile overdue cycles, so this is a backstop, not the only path.
-- settle_due_cycles() is owner-only and never exposed to client roles.
create extension if not exists pg_cron;

select cron.schedule(
  'warmdock-settle-due-cycles',
  '* * * * *',
  $$ select public.settle_due_cycles(); $$
);
