-- ============================================
-- Migration: Log Daily Credit Refresh in usage_log
-- Run this on existing databases
-- ============================================

-- Update use_credits: log daily refresh when resetting
create or replace function public.use_credits(
  p_user_id uuid,
  p_action text,
  p_cost int
)
returns int as $$
declare
  v_plan text;
  v_daily_limit int;
  v_balance int;
  v_purchased int;
  v_last_reset date;
  v_remaining_cost int;
  v_source text;
begin
  select plan into v_plan from public.profiles where id = p_user_id;
  if not found then return -1; end if;

  v_daily_limit := case v_plan
    when 'free' then 15
    when 'basic' then 60
    when 'pro' then 200
    when 'power' then 999999
    else 15
  end;

  select balance, purchased_credits, last_reset_date into v_balance, v_purchased, v_last_reset
  from public.credits
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.credits (user_id, balance, purchased_credits, last_reset_date)
    values (p_user_id, v_daily_limit, 0, current_date);
    v_balance := v_daily_limit;
    v_purchased := 0;
    v_last_reset := current_date;
  end if;

  -- Reset daily credits if new day
  if v_last_reset < current_date then
    v_balance := v_daily_limit;
    update public.credits
    set balance = v_daily_limit, last_reset_date = current_date
    where user_id = p_user_id;

    -- Log the daily refresh
    insert into public.usage_log (user_id, action, credits_used, source)
    values (p_user_id, 'daily-refresh', v_daily_limit, 'system');
  end if;

  if (v_balance + v_purchased) < p_cost then
    return -1;
  end if;

  v_remaining_cost := p_cost;

  if v_balance >= v_remaining_cost then
    update public.credits
    set balance = balance - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'daily';
    v_balance := v_balance - v_remaining_cost;
  elsif v_balance > 0 then
    v_remaining_cost := v_remaining_cost - v_balance;
    update public.credits
    set balance = 0, purchased_credits = purchased_credits - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'mixed';
    v_purchased := v_purchased - v_remaining_cost;
    v_balance := 0;
  else
    update public.credits
    set purchased_credits = purchased_credits - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'purchased';
    v_purchased := v_purchased - v_remaining_cost;
  end if;

  insert into public.usage_log (user_id, action, credits_used, source)
  values (p_user_id, p_action, p_cost, v_source);

  return v_balance + v_purchased;
end;
$$ language plpgsql security definer;

-- Update get_credit_balance: also log daily refresh
create or replace function public.get_credit_balance(p_user_id uuid)
returns json as $$
declare
  v_plan text;
  v_daily_limit int;
  v_balance int;
  v_purchased int;
  v_last_reset date;
begin
  select plan into v_plan from public.profiles where id = p_user_id;
  if not found then return json_build_object('balance', 0, 'daily_limit', 0, 'purchased_credits', 0, 'plan', 'free'); end if;

  v_daily_limit := case v_plan
    when 'free' then 15
    when 'basic' then 60
    when 'pro' then 200
    when 'power' then 999999
    else 15
  end;

  select balance, purchased_credits, last_reset_date into v_balance, v_purchased, v_last_reset
  from public.credits
  where user_id = p_user_id;

  if not found then
    insert into public.credits (user_id, balance, purchased_credits, last_reset_date)
    values (p_user_id, v_daily_limit, 0, current_date);
    return json_build_object('balance', v_daily_limit, 'daily_limit', v_daily_limit, 'purchased_credits', 0, 'plan', v_plan);
  end if;

  if v_last_reset < current_date then
    update public.credits
    set balance = v_daily_limit, last_reset_date = current_date
    where user_id = p_user_id;
    v_balance := v_daily_limit;

    -- Log the daily refresh
    insert into public.usage_log (user_id, action, credits_used, source)
    values (p_user_id, 'daily-refresh', v_daily_limit, 'system');
  end if;

  return json_build_object('balance', v_balance, 'daily_limit', v_daily_limit, 'purchased_credits', v_purchased, 'plan', v_plan);
end;
$$ language plpgsql security definer;
