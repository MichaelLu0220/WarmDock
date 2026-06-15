-- Discard a draft task + no new tasks after the day settles (Q57).
begin;
select plan(4);

do $$ begin
  insert into auth.users (id) values
    ('eeee1111-1111-1111-1111-111111111111'),
    ('ffff2222-2222-2222-2222-222222222222');
end $$;

-- ---- discard a draft (user e) ------------------------------------------
do $$
declare v_draft uuid; v_ready uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"eeee1111-1111-1111-1111-111111111111"}', true);
  v_draft := (public.create_task('scratch', gen_random_uuid(), 'UTC') ->> 'id')::uuid;
  perform public.discard_task(v_draft);

  v_ready := (public.create_task('keep', gen_random_uuid(), 'UTC') ->> 'id')::uuid;
  perform public.set_task_detail(v_ready, 2, null, false);
  perform set_config('test.e_ready', v_ready::text, true);
end $$;

select is((select count(*)::int from public.tasks
            where user_id = 'eeee1111-1111-1111-1111-111111111111' and title = 'scratch'),
  0, 'discard_task removes a draft task');
select throws_ok(
  $$ select public.discard_task(current_setting('test.e_ready')::uuid) $$,
  'P0001', 'TASK_DETAIL_ALREADY_SET', 'cannot discard a task once difficulty is set');

-- ---- no new task after the day settles (user f) ------------------------
do $$
declare v_task uuid; i int;
begin
  perform set_config('request.jwt.claims', '{"sub":"ffff2222-2222-2222-2222-222222222222"}', true);
  for i in 1..3 loop
    v_task := (public.create_task('t' || i, gen_random_uuid(), 'UTC') ->> 'id')::uuid;
    perform public.set_task_detail(v_task, 1, null, false);
    perform public.complete_task(v_task); -- 3rd completion settles the day early
  end loop;
end $$;

select ok(
  (select settled_at is not null from public.cycles
     where user_id = 'ffff2222-2222-2222-2222-222222222222'),
  'day is settled after completing every slot');
select throws_ok(
  $$ select public.create_task('too late', gen_random_uuid(), 'UTC') $$,
  'P0001', 'DAY_SETTLED', 'cannot create a task after the day has settled');

select * from finish();
rollback;
