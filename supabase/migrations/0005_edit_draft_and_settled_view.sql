-- WarmDock: editable draft titles + keep showing the just-settled day.

-- ---------------------------------------------------------------------------
-- "current cycle" = the open cycle, or (if none) the most recent cycle that is
-- still today in its own timezone. This keeps a just-settled day's completed
-- tasks visible (instead of looking like a brand new empty day) until a genuinely
-- new day begins.
-- ---------------------------------------------------------------------------
create function public.app_current_cycle_id(p_user_id uuid)
  returns uuid
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select coalesce(
    (select id from public.cycles
       where user_id = p_user_id and settled_at is null
       limit 1),
    (select c.id from public.cycles c
       where c.user_id = p_user_id
         and (now() at time zone c.timezone)::date = c.local_date
       order by c.opened_at desc
       limit 1)
  );
$$;

create or replace function public.bootstrap()
  returns jsonb
  language plpgsql
  stable
  security invoker
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cycle public.cycles%rowtype;
  v_tasks jsonb;
  v_wallet jsonb;
  v_profile jsonb;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_cycle from public.cycles where id = public.app_current_cycle_id(v_user);

  if v_cycle.id is not null then
    select coalesce(jsonb_agg(public.app_render_task(t.id) order by t.sort_order), '[]'::jsonb)
      into v_tasks from public.tasks t where t.cycle_id = v_cycle.id;
  else
    v_tasks := '[]'::jsonb;
  end if;

  select to_jsonb(w) into v_wallet from public.wallets w where w.user_id = v_user;
  select to_jsonb(p) into v_profile from public.profiles p where p.user_id = v_user;

  return jsonb_build_object(
    'today', v_cycle.local_date,
    'tasks', v_tasks,
    'wallet', v_wallet,
    'settings', v_profile,
    'summary', case when v_cycle.id is not null
                    then public.app_render_cycle_summary(v_cycle.id) else null end,
    'unlocks', public.app_unlock_status(v_user)
  );
end;
$$;

create or replace function public.list_today_tasks()
  returns jsonb
  language plpgsql
  stable
  security invoker
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cycle_id uuid;
  v_tasks jsonb;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  v_cycle_id := public.app_current_cycle_id(v_user);
  if v_cycle_id is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(public.app_render_task(t.id) order by t.sort_order), '[]'::jsonb)
    into v_tasks from public.tasks t where t.cycle_id = v_cycle_id;
  return v_tasks;
end;
$$;

-- ---------------------------------------------------------------------------
-- Editable draft title: the task content may change until the difficulty is set
-- (status leaves 'draft'). After that the task is immutable, as before.
-- ---------------------------------------------------------------------------
create function public.update_task_title(p_task_id uuid, p_title text)
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_task public.tasks%rowtype;
  v_cycle public.cycles%rowtype;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if v_title = '' then raise exception 'INVALID_INPUT' using errcode = 'P0001'; end if;

  perform public.app_reconcile_user(v_user);

  select * into v_task from public.tasks where id = p_task_id and user_id = v_user for update;
  if not found then raise exception 'TASK_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_cycle from public.cycles where id = v_task.cycle_id for update;
  if v_cycle.settled_at is not null then raise exception 'CYCLE_SETTLED' using errcode = 'P0001'; end if;
  if v_task.status <> 'draft' then raise exception 'TASK_DETAIL_ALREADY_SET' using errcode = 'P0001'; end if;

  update public.tasks set title = v_title, updated_at = now()
    where id = p_task_id
    returning * into v_task;

  return public.app_render_task(v_task.id);
end;
$$;

-- privileges (new functions default to PUBLIC execute)
revoke execute on function public.app_current_cycle_id(uuid) from public, anon;
revoke execute on function public.update_task_title(uuid, text) from public, anon;
grant execute on function public.app_current_cycle_id(uuid) to authenticated;
grant execute on function public.update_task_title(uuid, text) to authenticated;
