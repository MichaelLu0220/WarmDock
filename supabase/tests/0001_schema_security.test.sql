-- Phase 1 backend invariants — schema, RLS, privileges, seed data.
-- Run with: supabase test db
begin;
select plan(31);

-- ---- tables exist -------------------------------------------------------
select has_table('public', 'profiles',       'profiles table exists');
select has_table('public', 'wallets',        'wallets table exists');
select has_table('public', 'cycles',         'cycles table exists');
select has_table('public', 'tasks',          'tasks table exists');
select has_table('public', 'unlock_catalog', 'unlock_catalog table exists');
select has_table('public', 'unlocks',        'unlocks table exists');

-- ---- key constraints / indexes -----------------------------------------
select col_is_pk('public', 'wallets', 'user_id', 'wallets PK is user_id');
select has_index('public', 'tasks', 'tasks_user_request_unique',
  'tasks has unique(user_id, client_request_id) for idempotent create');
select has_index('public', 'cycles', 'cycles_one_open_per_user',
  'cycles has the one-open-per-user partial unique index');

-- ---- RLS enabled everywhere --------------------------------------------
select is(
  (select bool_and(rowsecurity) from pg_tables
     where schemaname = 'public'
       and tablename in ('profiles','wallets','cycles','tasks','unlocks','unlock_catalog')),
  true, 'RLS is enabled on all core tables');

-- ---- unlock catalog seed ------------------------------------------------
select is((select count(*)::int from public.unlock_catalog), 8, 'catalog seeded with 8 nodes');
select is((select cost from public.unlock_catalog where node_id = 'slots.4'),   30, 'slots.4 costs 30');
select is((select cost from public.unlock_catalog where node_id = 'slots.7'),  280, 'slots.7 costs 280');
select is((select cost from public.unlock_catalog where node_id = 'focus.basic'), 50, 'focus.basic costs 50');
select is((select effect_value from public.unlock_catalog where node_id = 'slots.5'), 5, 'slots.5 grants 5 slots');
select is((select requires from public.unlock_catalog where node_id = 'slots.5'), '{slots.4}'::text[], 'slots.5 requires slots.4');

-- ---- client table privileges (defence in depth) ------------------------
select is(has_table_privilege('authenticated', 'public.tasks',   'SELECT'), true,  'authenticated may SELECT tasks');
select is(has_table_privilege('authenticated', 'public.tasks',   'INSERT'), false, 'authenticated may NOT INSERT tasks');
select is(has_table_privilege('authenticated', 'public.tasks',   'UPDATE'), false, 'authenticated may NOT UPDATE tasks');
select is(has_table_privilege('authenticated', 'public.tasks',   'DELETE'), false, 'authenticated may NOT DELETE tasks');
select is(has_table_privilege('authenticated', 'public.wallets', 'UPDATE'), false, 'authenticated may NOT UPDATE wallets');
select is(has_table_privilege('authenticated', 'public.cycles',  'UPDATE'), false, 'authenticated may NOT UPDATE cycles');
select is(has_table_privilege('authenticated', 'public.unlocks', 'INSERT'), false, 'authenticated may NOT INSERT unlocks');
select is(has_table_privilege('authenticated', 'public.profiles','SELECT'), true,  'authenticated may SELECT profiles');
-- only specific non-authoritative preference columns are directly updatable
select is(has_column_privilege('authenticated', 'public.profiles', 'reminder_intensity', 'UPDATE'), true,
  'authenticated may UPDATE reminder_intensity');
select is(has_column_privilege('authenticated', 'public.profiles', 'ai_improvement_opt_out', 'UPDATE'), true,
  'authenticated may UPDATE ai_improvement_opt_out');
select is(has_column_privilege('authenticated', 'public.profiles', 'status', 'UPDATE'), false,
  'authenticated may NOT UPDATE profile.status');
select is(has_column_privilege('authenticated', 'public.profiles', 'deletion_due_at', 'UPDATE'), false,
  'authenticated may NOT UPDATE profile.deletion_due_at');

-- ---- function execute privileges ---------------------------------------
select is(has_function_privilege('authenticated', 'public.create_task(text, uuid, text)', 'EXECUTE'), true,
  'authenticated may EXECUTE create_task');
select is(has_function_privilege('authenticated', 'public.settle_cycle(uuid)', 'EXECUTE'), false,
  'authenticated may NOT EXECUTE settle_cycle (internal)');
select is(has_function_privilege('authenticated', 'public.settle_due_cycles()', 'EXECUTE'), false,
  'authenticated may NOT EXECUTE settle_due_cycles (cron only)');

select * from finish();
rollback;
