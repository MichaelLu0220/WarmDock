-- Phase 1 backend invariants — task lifecycle, idempotency, cross-account.
begin;
select plan(12);

-- setup: two users (trigger provisions profile + wallet); act as u1
do $$
begin
  insert into auth.users (id) values
    ('11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222');
  perform set_config('request.jwt.claims',
    '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  perform set_config('test.task1',
    (public.create_task('Write tests', 'aaaaaaaa-0000-0000-0000-000000000001', 'UTC') ->> 'id'), true);
  -- same client_request_id again must be idempotent
  perform set_config('test.dup',
    (public.create_task('ignored',     'aaaaaaaa-0000-0000-0000-000000000001', 'UTC') ->> 'id'), true);

  perform public.set_task_detail(current_setting('test.task1')::uuid, 3, 'medium', true);

  perform set_config('test.task2',
    (public.create_task('second',      'aaaaaaaa-0000-0000-0000-000000000002', 'UTC') ->> 'id'), true);
end $$;

select is((select status from public.tasks where id = current_setting('test.task2')::uuid),
  'draft', 'create_task produces a draft task');
select is(current_setting('test.dup'), current_setting('test.task1'),
  'same client_request_id returns the same task (idempotent create)');
select is((select count(*)::int from public.tasks
            where user_id = '11111111-1111-1111-1111-111111111111'),
  2, 'no duplicate row created for repeated request id');
select throws_ok(
  $$ select public.create_task('   ', 'aaaaaaaa-0000-0000-0000-000000000009', 'UTC') $$,
  'P0001', 'INVALID_INPUT', 'empty title is rejected');

select is((select status from public.tasks where id = current_setting('test.task1')::uuid),
  'ready', 'set_task_detail moves draft -> ready');
select is((select base_points from public.tasks where id = current_setting('test.task1')::uuid),
  3, 'base_points = difficulty');
select is((select final_reward_points from public.tasks where id = current_setting('test.task1')::uuid),
  4, 'final_reward = difficulty + focus bonus');
select throws_ok(
  $$ select public.set_task_detail(current_setting('test.task1')::uuid, 2, null, false) $$,
  'P0001', 'TASK_DETAIL_ALREADY_SET', 'detail cannot be set twice');
select throws_ok(
  $$ select public.complete_task(current_setting('test.task2')::uuid) $$,
  'P0001', 'TASK_SETUP_INCOMPLETE', 'cannot complete a draft task');

-- complete task1 (1 of 3 slots -> no early settlement; reward into pending bucket)
do $$ begin perform public.complete_task(current_setting('test.task1')::uuid); end $$;

select is((select pending_today_points from public.wallets
            where user_id = '11111111-1111-1111-1111-111111111111'),
  4, 'completion adds reward to pending bucket (not yet settled)');
select throws_ok(
  $$ select public.complete_task(current_setting('test.task1')::uuid) $$,
  'P0001', 'TASK_ALREADY_COMPLETED', 'cannot complete an already completed task');

-- cross-account: u2 cannot act on u1's task
do $$ begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
end $$;
select throws_ok(
  $$ select public.complete_task(current_setting('test.task1')::uuid) $$,
  'P0001', 'TASK_NOT_FOUND', 'another account cannot complete a foreign task');

select * from finish();
rollback;
