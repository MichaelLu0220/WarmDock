-- WarmDock authoritative RPCs (Phase 1)
-- Translates desktop services (task_service / refresh_service / unlock_service)
-- into SECURITY DEFINER Postgres functions.
--
-- Conventions (Database Security requirements):
--  * Mutations: SECURITY DEFINER, search_path = '', derive user from auth.uid(),
--    never accept a caller-supplied user id, fully-qualified relation names,
--    validate every state transition.
--  * Read helpers: SECURITY INVOKER, protected by table RLS.
--  * Internal functions (settle_cycle, reconcile, recompute, cron) are NOT
--    granted to authenticated/anon — only the owner/service role may call them,
--    and they are reached only from within other DEFINER functions.
--  * App error codes are raised as SQLSTATE P0001 with the code as the message,
--    mirroring the desktop AppError codes for the client mapper.

-- ===========================================================================
-- Read helpers (SECURITY INVOKER — safe via RLS; reusable inside DEFINER fns,
-- where they run as the owner and therefore see all rows they are given).
-- ===========================================================================

-- Derived unlock status (desktop catalog::compute_unlock_status).
create function public.app_unlock_status(p_user_id uuid)
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select jsonb_build_object(
    'max_visible_task_slots',
      greatest(3, coalesce(max(c.effect_value) filter (where c.effect = 'max_slots'), 0)),
    'focus_task_feature_unlocked',
      coalesce(bool_or(c.effect = 'focus_task'), false),
    'custom_refresh_time_unlocked',
      coalesce(bool_or(c.effect = 'custom_refresh_time'), false),
    'weekly_analysis_unlocked',
      coalesce(bool_or(c.effect = 'weekly_analysis'), false)
  )
  from public.unlocks u
  join public.unlock_catalog c on c.node_id = u.node_id
  where u.user_id = p_user_id;
$$;

-- Render a task as the wire shape (target_date comes from the owning cycle).
create function public.app_render_task(p_task_id uuid)
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'target_date', c.local_date,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'sort_order', t.sort_order,
    'status', t.status,
    'completed_at', t.completed_at,
    'difficulty', t.difficulty,
    'difficulty_suggested', t.difficulty_suggested,
    'base_points', t.base_points,
    'final_reward_points', t.final_reward_points,
    'is_focus', t.is_focus
  )
  from public.tasks t
  join public.cycles c on c.id = t.cycle_id
  where t.id = p_task_id;
$$;

-- Render a cycle's embedded summary (desktop DailySummary; date = local_date).
create function public.app_render_cycle_summary(p_cycle_id uuid)
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select jsonb_build_object(
    'date', c.local_date,
    'tasks_created', c.tasks_created,
    'tasks_completed', c.tasks_completed,
    'focus_tasks_completed', c.focus_tasks_completed,
    'points_earned', c.points_earned,
    'is_all_completed', c.is_all_completed
  )
  from public.cycles c
  where c.id = p_cycle_id;
$$;

-- ===========================================================================
-- Internal mutating helpers (DEFINER; owner-only).
-- ===========================================================================

-- Recompute a cycle's embedded summary from its tasks (desktop summary::recompute).
create function public.app_recompute_cycle_summary(p_cycle_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid;
  v_max_slots int;
begin
  select user_id into v_user from public.cycles where id = p_cycle_id;
  v_max_slots := (public.app_unlock_status(v_user) ->> 'max_visible_task_slots')::int;

  update public.cycles c set
    tasks_created         = sub.created,
    tasks_completed       = sub.completed,
    focus_tasks_completed = sub.focus_completed,
    points_earned         = sub.points,
    is_all_completed      = (sub.completed = v_max_slots)
  from (
    select
      count(*) filter (where status <> 'draft')                       as created,
      count(*) filter (where status = 'completed')                    as completed,
      count(*) filter (where status = 'completed' and is_focus)       as focus_completed,
      coalesce(sum(final_reward_points) filter (where status = 'completed'), 0) as points
    from public.tasks
    where cycle_id = p_cycle_id
  ) sub
  where c.id = p_cycle_id;
end;
$$;

-- Settle a single cycle (desktop wallet::rollover + refresh_service).
-- Idempotent: exits when already settled. Called by early settlement and cron.
create function public.settle_cycle(p_cycle_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
begin
  select * into v_cycle from public.cycles where id = p_cycle_id for update;
  if not found then
    return;
  end if;
  if v_cycle.settled_at is not null then
    return; -- idempotent: rewards/streak applied at most once
  end if;

  perform public.app_recompute_cycle_summary(p_cycle_id);
  select * into v_cycle from public.cycles where id = p_cycle_id;

  update public.wallets w set
    wallet_points              = w.wallet_points + w.pending_today_points - w.pending_today_unlock_spent,
    pending_today_points       = 0,
    pending_today_unlock_spent = 0,
    last_rollover_date         = v_cycle.local_date,
    streak_days = case when v_cycle.tasks_completed > 0 then w.streak_days + 1 else 0 end,
    best_streak_days = case when v_cycle.tasks_completed > 0
                            then greatest(w.best_streak_days, w.streak_days + 1)
                            else w.best_streak_days end
  where w.user_id = v_cycle.user_id;

  update public.cycles set settled_at = now() where id = p_cycle_id;
end;
$$;

-- Settle this user's open cycle if its reset_at has passed (mutation fallback
-- for a delayed cron run). At most one open cycle per user by constraint.
create function public.app_reconcile_user(p_user_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select id from public.cycles
    where user_id = p_user_id and settled_at is null and reset_at <= now()
  loop
    perform public.settle_cycle(r.id);
  end loop;
end;
$$;

-- Cron entry: settle every overdue open cycle across all users.
create function public.settle_due_cycles()
  returns integer
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select id from public.cycles
    where settled_at is null and reset_at <= now()
  loop
    perform public.settle_cycle(r.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ===========================================================================
-- Authoritative mutation RPCs (DEFINER; granted to authenticated).
-- ===========================================================================

-- create_task (desktop task_service::create_task) — idempotent on client_request_id.
-- The first task of a cycle locks the timezone and an absolute reset_at (midnight).
create function public.create_task(
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

  -- idempotency: a repeated create returns the existing task
  select * into v_existing from public.tasks
    where user_id = v_user and client_request_id = p_client_request_id;
  if found then
    return public.app_render_task(v_existing.id);
  end if;

  -- reconcile an overdue open cycle before accepting a new action
  perform public.app_reconcile_user(v_user);

  select * into v_cycle from public.cycles
    where user_id = v_user and settled_at is null
    for update;

  if not found then
    -- open a new cycle: lock timezone + next local midnight (custom reset deferred)
    v_local_date := (now() at time zone p_timezone)::date;
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

-- set_task_detail (desktop task_service::set_task_detail / Task::apply_detail).
create function public.set_task_detail(
  p_task_id uuid,
  p_difficulty integer,
  p_difficulty_suggested text,
  p_is_focus boolean
)
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_cycle public.cycles%rowtype;
  v_base int;
  v_final int;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if p_difficulty < 1 or p_difficulty > 5 then raise exception 'INVALID_INPUT' using errcode = 'P0001'; end if;
  if p_difficulty_suggested is not null
     and p_difficulty_suggested not in ('easy', 'medium', 'hard') then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;

  perform public.app_reconcile_user(v_user);

  select * into v_task from public.tasks where id = p_task_id and user_id = v_user for update;
  if not found then raise exception 'TASK_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_cycle from public.cycles where id = v_task.cycle_id for update;
  if v_cycle.settled_at is not null then raise exception 'CYCLE_SETTLED' using errcode = 'P0001'; end if;

  if v_task.status = 'completed' then raise exception 'TASK_ALREADY_COMPLETED' using errcode = 'P0001'; end if;
  if v_task.status = 'ready' then raise exception 'TASK_DETAIL_ALREADY_SET' using errcode = 'P0001'; end if;
  -- status = 'draft'

  v_base := p_difficulty;
  v_final := p_difficulty + case when coalesce(p_is_focus, false) then 1 else 0 end;

  update public.tasks set
    difficulty           = p_difficulty,
    difficulty_suggested = p_difficulty_suggested,
    is_focus             = coalesce(p_is_focus, false),
    base_points          = v_base,
    final_reward_points  = v_final,
    status               = 'ready',
    updated_at           = now()
  where id = p_task_id
  returning * into v_task;

  perform public.app_recompute_cycle_summary(v_cycle.id);
  return public.app_render_task(v_task.id);
end;
$$;

-- complete_task (desktop task_service::complete_task). Triggers early settlement
-- when every unlocked slot is completed.
create function public.complete_task(p_task_id uuid)
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_cycle public.cycles%rowtype;
  v_wallet public.wallets%rowtype;
  v_base int;
  v_reward int;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  perform public.app_reconcile_user(v_user);

  select * into v_task from public.tasks where id = p_task_id and user_id = v_user for update;
  if not found then raise exception 'TASK_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_cycle from public.cycles where id = v_task.cycle_id for update;
  if v_cycle.settled_at is not null then raise exception 'CYCLE_SETTLED' using errcode = 'P0001'; end if;

  if v_task.status = 'completed' then raise exception 'TASK_ALREADY_COMPLETED' using errcode = 'P0001'; end if;
  if v_task.status = 'draft' then raise exception 'TASK_SETUP_INCOMPLETE' using errcode = 'P0001'; end if;
  -- status = 'ready'

  update public.tasks set status = 'completed', completed_at = now(), updated_at = now()
    where id = p_task_id
    returning * into v_task;

  v_base := v_task.base_points;
  v_reward := v_task.final_reward_points;

  update public.wallets w set
    pending_today_points   = w.pending_today_points + v_reward,
    lifetime_points_earned = w.lifetime_points_earned + v_reward,
    last_completed_date    = v_cycle.local_date
  where w.user_id = v_user;

  perform public.app_recompute_cycle_summary(v_cycle.id);
  select * into v_cycle from public.cycles where id = v_cycle.id;

  if v_cycle.is_all_completed then
    perform public.settle_cycle(v_cycle.id);
    select * into v_cycle from public.cycles where id = v_cycle.id;
  end if;

  select * into v_wallet from public.wallets where user_id = v_user;

  return jsonb_build_object(
    'task', public.app_render_task(v_task.id),
    'reward_earned', v_base,
    'bonus_earned', v_reward - v_base,
    'pending_today_points', v_wallet.pending_today_points,
    'wallet_points', v_wallet.wallet_points,
    'today_summary', public.app_render_cycle_summary(v_cycle.id),
    'all_tasks_completed', v_cycle.is_all_completed,
    'streak_days', v_wallet.streak_days,
    'available_points_delta', v_reward,
    'available_points_after',
      v_wallet.wallet_points + v_wallet.pending_today_points - v_wallet.pending_today_unlock_spent
  );
end;
$$;

-- purchase_unlock (desktop unlock_service::purchase / catalog::validate_purchase).
create function public.purchase_unlock(p_node_id text)
  returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_node public.unlock_catalog%rowtype;
  v_wallet public.wallets%rowtype;
  v_available int;
  v_req text;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_node from public.unlock_catalog where node_id = p_node_id;
  if not found then raise exception 'UNKNOWN_UNLOCK_NODE' using errcode = 'P0001'; end if;

  if exists (select 1 from public.unlocks where user_id = v_user and node_id = p_node_id) then
    raise exception 'ALREADY_UNLOCKED' using errcode = 'P0001';
  end if;

  foreach v_req in array v_node.requires loop
    if not exists (select 1 from public.unlocks where user_id = v_user and node_id = v_req) then
      raise exception 'REQUIREMENT_NOT_MET' using errcode = 'P0001';
    end if;
  end loop;

  select * into v_wallet from public.wallets where user_id = v_user for update;
  v_available := v_wallet.wallet_points + v_wallet.pending_today_points - v_wallet.pending_today_unlock_spent;
  if v_available < v_node.cost then
    raise exception 'INSUFFICIENT_POINTS' using errcode = 'P0001';
  end if;

  insert into public.unlocks (user_id, node_id) values (v_user, p_node_id);
  update public.wallets w set
    points_spent_on_unlocks    = w.points_spent_on_unlocks + v_node.cost,
    pending_today_unlock_spent = w.pending_today_unlock_spent + v_node.cost
  where w.user_id = v_user
  returning * into v_wallet;

  return jsonb_build_object(
    'node_id', p_node_id,
    'unlocks', public.app_unlock_status(v_user),
    'available_points',
      v_wallet.wallet_points + v_wallet.pending_today_points - v_wallet.pending_today_unlock_spent,
    'points_spent_on_unlocks', v_wallet.points_spent_on_unlocks,
    'pending_today_unlock_spent', v_wallet.pending_today_unlock_spent
  );
end;
$$;

-- ===========================================================================
-- Read RPCs (INVOKER; granted to authenticated; RLS-protected).
-- ===========================================================================

-- Snapshot for app startup (desktop bootstrap). Pure read — settlement happens
-- via mutations and cron, never on read.
create function public.bootstrap()
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

  select * into v_cycle from public.cycles where user_id = v_user and settled_at is null;

  if found then
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

-- Tasks of the current open cycle (desktop get_today_tasks).
create function public.list_today_tasks()
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
  select id into v_cycle_id from public.cycles where user_id = v_user and settled_at is null;
  if not found then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(public.app_render_task(t.id) order by t.sort_order), '[]'::jsonb)
    into v_tasks from public.tasks t where t.cycle_id = v_cycle_id;
  return v_tasks;
end;
$$;

-- Unlock progress with affordability (desktop unlock_service::progress).
create function public.unlock_progress()
  returns jsonb
  language plpgsql
  stable
  security invoker
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_wallet public.wallets%rowtype;
  v_available int;
  v_nodes jsonb;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  select * into v_wallet from public.wallets where user_id = v_user;
  v_available := v_wallet.wallet_points + v_wallet.pending_today_points - v_wallet.pending_today_unlock_spent;

  select coalesce(jsonb_agg(node order by node->>'node_id'), '[]'::jsonb) into v_nodes
  from (
    select jsonb_build_object(
      'node_id', c.node_id,
      'category', c.category,
      'cost', c.cost,
      'requires', to_jsonb(c.requires),
      'unlocked', (u.node_id is not null),
      'unlocked_at', u.unlocked_at,
      'requirements_met', req.met,
      'affordable', (u.node_id is null) and req.met and (v_available >= c.cost)
    ) as node
    from public.unlock_catalog c
    left join public.unlocks u on u.node_id = c.node_id and u.user_id = v_user
    cross join lateral (
      select coalesce(bool_and(
               exists (select 1 from public.unlocks uu where uu.user_id = v_user and uu.node_id = r)
             ), true) as met
      from unnest(c.requires) r
    ) req
  ) nodes;

  return jsonb_build_object(
    'available_points', v_available,
    'lifetime_points_earned', v_wallet.lifetime_points_earned,
    'points_spent_on_unlocks', v_wallet.points_spent_on_unlocks,
    'nodes', v_nodes
  );
end;
$$;

-- ===========================================================================
-- Function privileges: revoke the implicit PUBLIC execute, then grant only the
-- public API surface to authenticated. Internal/cron functions stay owner-only.
-- ===========================================================================
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

grant execute on function public.create_task(text, uuid, text)                  to authenticated;
grant execute on function public.set_task_detail(uuid, integer, text, boolean)  to authenticated;
grant execute on function public.complete_task(uuid)                            to authenticated;
grant execute on function public.purchase_unlock(text)                          to authenticated;
grant execute on function public.bootstrap()                                    to authenticated;
grant execute on function public.list_today_tasks()                             to authenticated;
grant execute on function public.unlock_progress()                              to authenticated;
-- read helpers reached from INVOKER RPCs need execute for the authenticated caller
grant execute on function public.app_unlock_status(uuid)                        to authenticated;
grant execute on function public.app_render_task(uuid)                          to authenticated;
grant execute on function public.app_render_cycle_summary(uuid)                 to authenticated;
