-- Expose whether the current day is already settled, so the client can keep the
-- "day done" view (and hide the add-task slot) even if a new slot is unlocked
-- after settlement.
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
    'settled', (v_cycle.id is not null and v_cycle.settled_at is not null),
    'tasks', v_tasks,
    'wallet', v_wallet,
    'settings', v_profile,
    'summary', case when v_cycle.id is not null
                    then public.app_render_cycle_summary(v_cycle.id) else null end,
    'unlocks', public.app_unlock_status(v_user)
  );
end;
$$;
