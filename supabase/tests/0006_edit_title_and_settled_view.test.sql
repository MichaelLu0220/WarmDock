-- Editable draft titles + the just-settled day stays visible.
begin;
select plan(7);

do $$ begin
  insert into auth.users (id) values
    ('cccc1111-1111-1111-1111-111111111111'),
    ('dddd2222-2222-2222-2222-222222222222');
end $$;

-- ---- editable draft title (user c) -------------------------------------
do $$
declare v_task uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"cccc1111-1111-1111-1111-111111111111"}', true);
  v_task := (public.create_task('typoo', gen_random_uuid(), 'UTC') ->> 'id')::uuid;
  perform set_config('test.c_task', v_task::text, true);
  perform public.update_task_title(v_task, 'fixed title');
end $$;

select is((select title from public.tasks where id = current_setting('test.c_task')::uuid),
  'fixed title', 'update_task_title edits a draft task');
select throws_ok(
  $$ select public.update_task_title(current_setting('test.c_task')::uuid, '') $$,
  'P0001', 'INVALID_INPUT', 'empty title is rejected');

-- once detail is set (ready), the title is locked
do $$ begin
  perform public.set_task_detail(current_setting('test.c_task')::uuid, 2, null, false);
end $$;
select throws_ok(
  $$ select public.update_task_title(current_setting('test.c_task')::uuid, 'too late') $$,
  'P0001', 'TASK_DETAIL_ALREADY_SET', 'cannot edit the title once difficulty is set');

-- ---- just-settled day remains visible (user d) --------------------------
do $$
declare v_task uuid; i int;
begin
  perform set_config('request.jwt.claims', '{"sub":"dddd2222-2222-2222-2222-222222222222"}', true);
  for i in 1..3 loop
    v_task := (public.create_task('t' || i, gen_random_uuid(), 'UTC') ->> 'id')::uuid;
    perform public.set_task_detail(v_task, 1, null, false);
    perform public.complete_task(v_task); -- 3rd completion settles the cycle early
  end loop;
end $$;

select ok(
  (select settled_at is not null from public.cycles
     where user_id = 'dddd2222-2222-2222-2222-222222222222'),
  'cycle is settled after completing all slots');
select ok(
  public.app_current_cycle_id('dddd2222-2222-2222-2222-222222222222') is not null,
  'app_current_cycle_id still resolves to the same-day settled cycle');
select is(
  jsonb_array_length(public.bootstrap() -> 'tasks'),
  3, 'bootstrap still returns the completed tasks of the just-settled day');
select is(
  (public.bootstrap() ->> 'settled')::boolean,
  true, 'bootstrap reports the just-settled day as settled');

select * from finish();
rollback;
