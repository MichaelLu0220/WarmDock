-- Phase 1 backend invariants — randomized state-machine fuzz.
-- Runs a deterministic (seeded) sequence of valid AND invalid actions, swallows
-- the domain rejections (which must leave state unchanged), then asserts the
-- core invariants hold no matter what sequence occurred.
begin;
select plan(6);

do $$
declare
  u uuid := '44444444-4444-4444-4444-444444444444';
  i int;
  act int;
  v_task uuid;
  v_node text;
  v_diff int;
  v_sug text;
  v_focus boolean;
  v_req uuid;
  v_last_req uuid := gen_random_uuid();
  sug_arr text[] := array['easy', 'medium', 'hard', null, 'bogus'];
begin
  insert into auth.users (id) values (u);
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);
  perform setseed(0.42);

  for i in 1..300 loop
    act := floor(random() * 5)::int;
    begin
      if act = 0 then
        -- create; sometimes reuse the last request id to exercise idempotency
        if random() < 0.2 then
          v_req := v_last_req;
        else
          v_req := gen_random_uuid();
          v_last_req := v_req;
        end if;
        perform public.create_task('task ' || i, v_req, 'UTC');

      elsif act = 1 then
        select id into v_task from public.tasks where user_id = u order by random() limit 1;
        if v_task is not null then
          v_diff := floor(random() * 7)::int;            -- 0..6 (0 and 6 are invalid)
          v_sug := sug_arr[1 + floor(random() * 5)::int]; -- includes null and 'bogus'
          v_focus := random() < 0.5;
          perform public.set_task_detail(v_task, v_diff, v_sug, v_focus);
        end if;

      elsif act = 2 then
        select id into v_task from public.tasks where user_id = u order by random() limit 1;
        if v_task is not null then
          perform public.complete_task(v_task);
        end if;

      elsif act = 3 then
        select node_id into v_node from public.unlock_catalog order by random() limit 1;
        perform public.purchase_unlock(v_node);

      else
        -- advance time and run the scheduled settler
        update public.cycles set reset_at = now() - interval '1 hour'
          where user_id = u and settled_at is null;
        perform public.settle_due_cycles();
      end if;
    exception when others then
      null;  -- invalid/stale transitions are rejected and must leave state intact
    end;
  end loop;
end $$;

-- ledger projections from the source-of-truth tables
select is(
  (select lifetime_points_earned from public.wallets where user_id = '44444444-4444-4444-4444-444444444444'),
  (select coalesce(sum(final_reward_points), 0)::int from public.tasks
     where user_id = '44444444-4444-4444-4444-444444444444' and status = 'completed'),
  'lifetime_points_earned == sum of completed task rewards');

select is(
  (select points_spent_on_unlocks from public.wallets where user_id = '44444444-4444-4444-4444-444444444444'),
  (select coalesce(sum(c.cost), 0)::int from public.unlocks un
     join public.unlock_catalog c on c.node_id = un.node_id
     where un.user_id = '44444444-4444-4444-4444-444444444444'),
  'points_spent_on_unlocks == sum of unlocked node costs');

select is(
  (select wallet_points + pending_today_points - pending_today_unlock_spent
     from public.wallets where user_id = '44444444-4444-4444-4444-444444444444'),
  (select coalesce(sum(final_reward_points), 0)::int from public.tasks
     where user_id = '44444444-4444-4444-4444-444444444444' and status = 'completed')
  - (select coalesce(sum(c.cost), 0)::int from public.unlocks un
       join public.unlock_catalog c on c.node_id = un.node_id
       where un.user_id = '44444444-4444-4444-4444-444444444444'),
  'available_points == ledger earned (completed) − spent (unlocks)');

select is(
  (select count(*)::int from public.tasks
     where user_id = '44444444-4444-4444-4444-444444444444' and status <> 'draft'
       and not (base_points = difficulty
                and final_reward_points = difficulty + (case when is_focus then 1 else 0 end))),
  0, 'every non-draft task carries correctly computed, uncorrupted points');

select is(
  (select (wallet_points >= 0 and pending_today_points >= 0 and pending_today_unlock_spent >= 0
           and streak_days >= 0 and best_streak_days >= streak_days)
     from public.wallets where user_id = '44444444-4444-4444-4444-444444444444'),
  true, 'wallet non-negativity and best_streak >= streak hold');

select is(
  (select count(distinct client_request_id)::int from public.tasks
     where user_id = '44444444-4444-4444-4444-444444444444'),
  (select count(*)::int from public.tasks
     where user_id = '44444444-4444-4444-4444-444444444444'),
  'no duplicate task exists for a single client_request_id');

select * from finish();
rollback;
