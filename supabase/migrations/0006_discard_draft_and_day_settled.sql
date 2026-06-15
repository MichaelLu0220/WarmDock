-- WarmDock: discard a draft task + enforce "no new tasks after the day settles".

-- ---------------------------------------------------------------------------
-- Discard a draft task (cancel before difficulty is set). Tasks remain immutable
-- once committed (status leaves 'draft'); a draft may be removed entirely.
-- ---------------------------------------------------------------------------
create function public.discard_task(p_task_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_cycle public.cycles%rowtype;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_task from public.tasks where id = p_task_id and user_id = v_user for update;
  if not found then return; end if; -- already gone (idempotent)

  select * into v_cycle from public.cycles where id = v_task.cycle_id for update;
  if v_cycle.settled_at is not null then raise exception 'CYCLE_SETTLED' using errcode = 'P0001'; end if;
  if v_task.status <> 'draft' then raise exception 'TASK_DETAIL_ALREADY_SET' using errcode = 'P0001'; end if;

  delete from public.tasks where id = p_task_id;
  perform public.app_recompute_cycle_summary(v_cycle.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- create_task: same as before, but a day that has already settled (early or
-- scheduled) cannot be reopened — no new tasks for that local date. Buying a
-- slot unlock afterwards applies to the next day, not the settled one.
-- ---------------------------------------------------------------------------
create or replace function public.create_task(
  p_title text,
  p_client_request_id uuid,
  p_timezone text
)
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_existing public.tasks%rowtype;
  v_cycle public.cycles%rowtype;
  v_local_date date;
  v_reset timestamptz;
  v_sort int;
  v_task_id uuid;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if v_title = '' then raise exception 'INVALID_INPUT' using errcode = 'P0001'; end if;
  if p_timezone is null or p_timezone = '' then raise exception 'INVALID_INPUT' using errcode = 'P0001'; end if;
  if p_client_request_id is null then raise exception 'INVALID_INPUT' using errcode = 'P0001'; end if;

  select * into v_existing from public.tasks
    where user_id = v_user and client_request_id = p_client_request_id;
  if found then
    return public.app_render_task(v_existing.id);
  end if;

  perform public.app_reconcile_user(v_user);

  select * into v_cycle from public.cycles
    where user_id = v_user and settled_at is null
    for update;

  if not found then
    v_local_date := (now() at time zone p_timezone)::date;
    -- the day already ended (early or scheduled settlement) -> cannot reopen it
    if exists (
      select 1 from public.cycles
      where user_id = v_user and local_date = v_local_date and settled_at is not null
    ) then
      raise exception 'DAY_SETTLED' using errcode = 'P0001';
    end if;
    v_reset := (((v_local_date + 1)::text || ' 00:00')::timestamp) at time zone p_timezone;
    insert into public.cycles (user_id, local_date, timezone, reset_at)
      values (v_user, v_local_date, p_timezone, v_reset)
      returning * into v_cycle;
  end if;

  select coalesce(max(sort_order) + 1, 0) into v_sort
    from public.tasks where cycle_id = v_cycle.id;

  insert into public.tasks (user_id, cycle_id, client_request_id, title, sort_order)
    values (v_user, v_cycle.id, p_client_request_id, v_title, v_sort)
    returning id into v_task_id;

  return public.app_render_task(v_task_id);
end;
$$;

revoke execute on function public.discard_task(uuid) from public, anon;
grant execute on function public.discard_task(uuid) to authenticated;
