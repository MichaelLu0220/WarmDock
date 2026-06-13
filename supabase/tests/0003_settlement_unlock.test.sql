-- Phase 1 backend invariants — settlement (scheduled + early), idempotency,
-- unlock purchase branches, and RLS read isolation.
begin;
select plan(13);

-- users: u1 (unlock), u2 (scheduled settlement), u3 (early settlement)
do $$ begin
  insert into auth.users (id) values
    ('11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333');
end $$;

-- ---- scheduled settlement + idempotency (u2) ---------------------------
do $$
declare v_task uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
  v_task := (public.create_task('settle me', 'bbbbbbbb-0000-0000-0000-000000000001', 'UTC') ->> 'id')::uuid;
  perform public.set_task_detail(v_task, 2, null, false);   -- reward 2
  perform public.complete_task(v_task);                     -- 1 of 3 -> stays open

  -- force the cycle overdue and run the cron settler (owner-only)
  update public.cycles set reset_at = now() - interval '1 hour'
    where user_id = '22222222-2222-2222-2222-222222222222' and settled_at is null;
  perform set_config('test.s1', public.settle_due_cycles()::text, true);
  -- second run must settle nothing (idempotent)
  perform set_config('test.s2', public.settle_due_cycles()::text, true);
end $$;

select is((select wallet_points from public.wallets
            where user_id = '22222222-2222-2222-2222-222222222222'),
  2, 'settlement transfers pending into wallet_points');
select is((select streak_days from public.wallets
            where user_id = '22222222-2222-2222-2222-222222222222'),
  1, 'a day with >=1 completion increments the streak');
select is(current_setting('test.s2'), '0', 'a settled cycle is not settled again (idempotent)');
select is((select wallet_points from public.wallets
            where user_id = '22222222-2222-2222-2222-222222222222'),
  2, 'wallet unchanged after a redundant settle run');

-- ---- early settlement when all unlocked slots are completed (u3) --------
do $$
declare v_task uuid; i int;
begin
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
  for i in 1..3 loop
    v_task := (public.create_task('t' || i, gen_random_uuid(), 'UTC') ->> 'id')::uuid;
    perform public.set_task_detail(v_task, 1, null, false);  -- reward 1 each
    if i = 1 then perform set_config('test.u3task', v_task::text, true); end if;
    perform public.complete_task(v_task);                    -- 3rd completion settles early
  end loop;
end $$;

select is((select settled_at is not null from public.cycles
            where user_id = '33333333-3333-3333-3333-333333333333'),
  true, 'completing every unlocked slot settles the cycle early');
select is((select wallet_points from public.wallets
            where user_id = '33333333-3333-3333-3333-333333333333'),
  3, 'early settlement transfers the full reward (1+1+1)');
select is((select streak_days from public.wallets
            where user_id = '33333333-3333-3333-3333-333333333333'),
  1, 'early settlement also advances the streak');

-- ---- unlock purchase branches (u1, funded) -----------------------------
do $$ begin
  update public.wallets set wallet_points = 500
    where user_id = '11111111-1111-1111-1111-111111111111';
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
  perform public.purchase_unlock('root.awaken');
  perform public.purchase_unlock('slots.4');
  perform public.purchase_unlock('slots.5');
end $$;

select is((public.app_unlock_status('11111111-1111-1111-1111-111111111111') ->> 'max_visible_task_slots')::int,
  5, 'max_slots takes the maximum of unlocked capacity nodes');
select throws_ok($$ select public.purchase_unlock('slots.4') $$,
  'P0001', 'ALREADY_UNLOCKED', 'cannot purchase an already-unlocked node');
select throws_ok($$ select public.purchase_unlock('slots.7') $$,
  'P0001', 'REQUIREMENT_NOT_MET', 'cannot purchase a node whose requirement is unmet');
select throws_ok($$ select public.purchase_unlock('does.not.exist') $$,
  'P0001', 'UNKNOWN_UNLOCK_NODE', 'unknown node id is rejected');

-- insufficient points (u2 has only 2 points)
do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
  perform public.purchase_unlock('root.awaken');  -- cost 0, satisfies requirement
end $$;
select throws_ok($$ select public.purchase_unlock('time.custom_refresh') $$,
  'P0001', 'INSUFFICIENT_POINTS', 'cannot purchase without enough available points');

-- ---- RLS read isolation: u2 cannot read u3's task ----------------------
do $$ begin
  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
  set local role authenticated;
  perform set_config('test.u2_sees', (select count(*)::text from public.tasks
                                       where id = current_setting('test.u3task')::uuid), true);
  reset role;
end $$;
select is(current_setting('test.u2_sees'), '0',
  'RLS prevents one account from reading another account''s rows');

select * from finish();
rollback;
