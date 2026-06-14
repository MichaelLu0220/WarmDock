-- WarmDock account deletion lifecycle (Phase 3 gap).
-- A deletion request deactivates the account, signs out every device, and starts
-- a 30-day grace period. Signing back in within the window can recover it; after
-- the window a scheduled job permanently deletes the auth user (cascading to all
-- WarmDock data via ON DELETE CASCADE).

-- Request deletion: enter the grace period and revoke all sessions.
create function public.request_account_deletion()
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  update public.profiles
     set status = 'pending_deletion',
         deletion_due_at = now() + interval '30 days'
   where user_id = v_user
   returning * into v_profile;

  -- sign out every device (invalidate refresh tokens / sessions)
  delete from auth.sessions where user_id = v_user;

  return to_jsonb(v_profile);
end;
$$;

-- Recover within the grace period.
create function public.recover_account()
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  update public.profiles
     set status = 'active',
         deletion_due_at = null
   where user_id = v_user and status = 'pending_deletion'
   returning * into v_profile;

  if not found then
    -- nothing to recover (already active) — return current profile
    select * into v_profile from public.profiles where user_id = v_user;
  end if;

  return to_jsonb(v_profile);
end;
$$;

-- Scheduled permanent deletion (cron / owner only). Deleting the auth user
-- cascades to profiles, wallets, cycles, tasks, unlocks.
create function public.purge_due_deletions()
  returns integer
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_count int;
begin
  with due as (
    select user_id from public.profiles
     where status = 'pending_deletion'
       and deletion_due_at is not null
       and deletion_due_at <= now()
  ), deleted as (
    delete from auth.users where id in (select user_id from due) returning id
  )
  select count(*) into v_count from deleted;
  return v_count;
end;
$$;

-- privileges: new functions default to PUBLIC execute — lock them down.
revoke execute on function public.request_account_deletion() from public, anon;
revoke execute on function public.recover_account() from public, anon;
revoke execute on function public.purge_due_deletions() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.recover_account() to authenticated;
-- purge_due_deletions stays owner/service-role only

-- hourly permanent-deletion sweep
select cron.schedule(
  'warmdock-purge-deletions',
  '0 * * * *',
  $$ select public.purge_due_deletions(); $$
);
