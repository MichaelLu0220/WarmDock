-- Phase 3 gap — account deletion lifecycle (request / recover / purge).
begin;
select plan(7);

do $$ begin
  insert into auth.users (id) values
    ('aaaa1111-1111-1111-1111-111111111111'),
    ('bbbb2222-2222-2222-2222-222222222222');
end $$;

-- ---- request + recover (user a) ----------------------------------------
do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"aaaa1111-1111-1111-1111-111111111111"}', true);
  perform public.request_account_deletion();
end $$;

select is((select status from public.profiles where user_id = 'aaaa1111-1111-1111-1111-111111111111'),
  'pending_deletion', 'request_account_deletion sets status to pending_deletion');
select ok((select deletion_due_at from public.profiles where user_id = 'aaaa1111-1111-1111-1111-111111111111')
            > now() + interval '29 days',
  'deletion_due_at is ~30 days out');

do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"aaaa1111-1111-1111-1111-111111111111"}', true);
  perform public.recover_account();
end $$;

select is((select status from public.profiles where user_id = 'aaaa1111-1111-1111-1111-111111111111'),
  'active', 'recover_account restores status to active');
select ok((select deletion_due_at from public.profiles where user_id = 'aaaa1111-1111-1111-1111-111111111111') is null,
  'recover_account clears deletion_due_at');

-- ---- scheduled purge (user b, due in the past) -------------------------
do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"bbbb2222-2222-2222-2222-222222222222"}', true);
  perform public.request_account_deletion();
  -- force the grace period to have elapsed
  update public.profiles set deletion_due_at = now() - interval '1 day'
    where user_id = 'bbbb2222-2222-2222-2222-222222222222';
  perform public.purge_due_deletions();
end $$;

select is((select count(*)::int from public.profiles where user_id = 'bbbb2222-2222-2222-2222-222222222222'),
  0, 'purge_due_deletions removes the overdue profile (cascade from auth.users)');
select is((select count(*)::int from auth.users where id = 'bbbb2222-2222-2222-2222-222222222222'),
  0, 'purge_due_deletions removes the auth user');

-- ---- privilege: clients cannot run the purge sweep ---------------------
select is(has_function_privilege('authenticated', 'public.purge_due_deletions()', 'EXECUTE'), false,
  'authenticated may NOT execute purge_due_deletions');

select * from finish();
rollback;
