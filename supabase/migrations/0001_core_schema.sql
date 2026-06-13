-- WarmDock cloud core schema (Phase 1)
-- Authoritative data model for Supabase. Translates the desktop Rust domain
-- (apps/desktop/src-tauri/src/domain) into multi-user Postgres with RLS.
--
-- Design notes:
--  * Singleton desktop wallet/settings become per-user rows keyed by auth.uid().
--  * The desktop `target_date` string is replaced by a `cycles` abstraction:
--    the first task of a cycle locks the timezone and an absolute reset_at.
--  * The daily summary is embedded on the cycle row (1 cycle = 1 day + its summary).
--  * Clients get RLS-protected SELECT only. All authoritative writes go through
--    SECURITY DEFINER RPCs (added in 0002); RLS denies direct writes as defence
--    in depth.
--  * The unlock catalog is seeded reference data so SQL RPCs can read cost/requires.

-- ---------------------------------------------------------------------------
-- profiles: per-user non-authoritative preferences + account lifecycle
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  reminder_intensity     text not null default 'normal'
                           check (reminder_intensity in ('off', 'low', 'normal', 'high')),
  ai_improvement_opt_out boolean not null default false,
  locale                 text not null default 'en',
  theme_mode             text not null default 'system'
                           check (theme_mode in ('light', 'dark', 'system')),
  custom_refresh_time    text check (custom_refresh_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  age_confirmed_13       boolean not null default false,
  status                 text not null default 'active'
                           check (status in ('active', 'pending_deletion')),
  deletion_due_at        timestamptz,
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- wallets: per-user authoritative points / streak (desktop user_wallet)
-- ---------------------------------------------------------------------------
create table public.wallets (
  user_id                    uuid primary key references auth.users (id) on delete cascade,
  wallet_points              integer not null default 0 check (wallet_points >= 0),
  pending_today_points       integer not null default 0 check (pending_today_points >= 0),
  pending_today_unlock_spent integer not null default 0 check (pending_today_unlock_spent >= 0),
  streak_days                integer not null default 0 check (streak_days >= 0),
  best_streak_days           integer not null default 0 check (best_streak_days >= streak_days),
  last_completed_date        date,
  last_rollover_date         date,
  lifetime_points_earned     integer not null default 0 check (lifetime_points_earned >= 0),
  points_spent_on_unlocks    integer not null default 0 check (points_spent_on_unlocks >= 0)
);

-- ---------------------------------------------------------------------------
-- cycles: a single day boundary + its embedded summary.
-- The first task locks timezone + reset_at. At most one open cycle per user.
-- ---------------------------------------------------------------------------
create table public.cycles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  local_date            date not null,        -- YYYY-MM-DD in the locked timezone
  timezone              text not null,        -- IANA tz locked by the first task
  reset_at              timestamptz not null, -- absolute settlement time
  opened_at             timestamptz not null default now(),
  settled_at            timestamptz,          -- null = open; set once at settlement
  -- embedded daily summary (desktop daily_summary), recomputed on each completion
  tasks_created         integer not null default 0 check (tasks_created >= 0),
  tasks_completed       integer not null default 0 check (tasks_completed >= 0),
  focus_tasks_completed integer not null default 0 check (focus_tasks_completed >= 0),
  points_earned         integer not null default 0 check (points_earned >= 0),
  is_all_completed      boolean not null default false
);

-- At most one open (unsettled) cycle per user.
create unique index cycles_one_open_per_user
  on public.cycles (user_id)
  where settled_at is null;

-- Cron settlement scans open cycles whose reset_at has passed.
create index cycles_open_due on public.cycles (reset_at) where settled_at is null;
create index cycles_user_date on public.cycles (user_id, local_date);

-- ---------------------------------------------------------------------------
-- tasks: immutable after creation (desktop tasks). Belong to a cycle.
-- ---------------------------------------------------------------------------
create table public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  cycle_id             uuid not null references public.cycles (id) on delete cascade,
  client_request_id    uuid not null,        -- idempotent create key
  title                text not null check (length(trim(title)) > 0),
  status               text not null default 'draft'
                           check (status in ('draft', 'ready', 'completed')),
  sort_order           integer not null default 0,
  difficulty           integer check (difficulty between 1 and 5),
  difficulty_suggested text check (difficulty_suggested in ('easy', 'medium', 'hard')),
  is_focus             boolean not null default false,
  base_points          integer not null default 0 check (base_points >= 0),
  final_reward_points  integer not null default 0 check (final_reward_points >= base_points),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz,
  -- state-machine integrity (mirrors desktop CHECKs)
  constraint tasks_completed_needs_timestamp
    check (status <> 'completed' or completed_at is not null),
  constraint tasks_non_draft_needs_difficulty
    check (status = 'draft' or difficulty is not null),
  -- idempotent create: one task per (user, request id)
  constraint tasks_user_request_unique unique (user_id, client_request_id)
);

create index tasks_cycle_order on public.tasks (cycle_id, sort_order);

-- ---------------------------------------------------------------------------
-- unlock_catalog: seeded reference data (desktop catalog/unlock.rs).
-- Version-controlled here so SQL RPCs can validate purchases.
-- ---------------------------------------------------------------------------
create table public.unlock_catalog (
  node_id      text primary key,
  category     text not null,
  cost         integer not null check (cost >= 0),
  requires     text[] not null default '{}',
  effect       text not null
                 check (effect in ('none', 'max_slots', 'focus_task',
                                   'custom_refresh_time', 'weekly_analysis')),
  effect_value integer  -- max_slots target for effect = 'max_slots'
);

insert into public.unlock_catalog (node_id, category, cost, requires, effect, effect_value) values
  ('root.awaken',         'root',     0,   '{}',              'none',                null),
  ('slots.4',             'capacity', 30,  '{root.awaken}',   'max_slots',           4),
  ('slots.5',             'capacity', 80,  '{slots.4}',       'max_slots',           5),
  ('slots.6',             'capacity', 160, '{slots.5}',       'max_slots',           6),
  ('slots.7',             'capacity', 280, '{slots.6}',       'max_slots',           7),
  ('focus.basic',         'focus',    50,  '{root.awaken}',   'focus_task',          null),
  ('time.custom_refresh', 'time',     20,  '{root.awaken}',   'custom_refresh_time', null),
  ('analysis.weekly',     'analysis', 120, '{root.awaken}',   'weekly_analysis',     null);

-- ---------------------------------------------------------------------------
-- unlocks: per-user purchased nodes (desktop unlock_nodes)
-- ---------------------------------------------------------------------------
create table public.unlocks (
  user_id     uuid not null references auth.users (id) on delete cascade,
  node_id     text not null references public.unlock_catalog (node_id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only SELECT; no client write policies (deny).
-- Authoritative writes happen in SECURITY DEFINER RPCs (migration 0002).
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.wallets   enable row level security;
alter table public.cycles    enable row level security;
alter table public.tasks     enable row level security;
alter table public.unlocks   enable row level security;
alter table public.unlock_catalog enable row level security;

create policy profiles_select_own on public.profiles
  for select using ((select auth.uid()) = user_id);
-- non-authoritative preferences: owner may update (column grants restrict which)
create policy profiles_update_own on public.profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy wallets_select_own on public.wallets
  for select using ((select auth.uid()) = user_id);

create policy cycles_select_own on public.cycles
  for select using ((select auth.uid()) = user_id);

create policy tasks_select_own on public.tasks
  for select using ((select auth.uid()) = user_id);

create policy unlocks_select_own on public.unlocks
  for select using ((select auth.uid()) = user_id);

-- unlock_catalog is shared reference data, readable by any authenticated user
create policy unlock_catalog_select on public.unlock_catalog
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Table privileges: clients may read; only specific profile columns are writable.
-- (Authoritative tables get no INSERT/UPDATE/DELETE grant to authenticated.)
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.wallets, public.cycles, public.tasks,
              public.unlocks, public.unlock_catalog
  from anon, authenticated;

grant select on public.profiles      to authenticated;
grant select on public.wallets       to authenticated;
grant select on public.cycles        to authenticated;
grant select on public.tasks         to authenticated;
grant select on public.unlocks       to authenticated;
grant select on public.unlock_catalog to authenticated;

-- only non-authoritative preference columns are directly updatable by the owner
grant update (reminder_intensity, ai_improvement_opt_out, locale, theme_mode)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- New-user provisioning: create profile + wallet rows on signup.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
    on conflict (user_id) do nothing;
  insert into public.wallets (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
