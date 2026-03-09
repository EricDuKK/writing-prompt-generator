-- ============================================
-- Migration: Add Credit Packs Support
-- Run this on existing databases to add purchased credits
-- ============================================

-- 1. Add purchased_credits column to credits table
alter table public.credits add column if not exists purchased_credits int not null default 0;

-- 2. Add source column to usage_log
alter table public.usage_log add column if not exists source text not null default 'daily';

-- 3. Create credit_purchases table
create table if not exists public.credit_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pack_id text not null,
  credits int not null,
  amount_cents int not null,
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_purchases_user on public.credit_purchases(user_id, created_at desc);
create index if not exists idx_credit_purchases_session on public.credit_purchases(stripe_session_id);

-- 4. RLS for credit_purchases
alter table public.credit_purchases enable row level security;

create policy "Users can view own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);

-- 5. Update plan limits (Plan A)
-- free: 20 -> 15, basic: 100 -> 60, pro: 500 -> 200

-- 6. Update handle_new_user function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.credits (user_id, balance, purchased_credits, last_reset_date)
  values (new.id, 15, 0, current_date);

  return new;
end;
$$ language plpgsql security definer;

-- 7. Update use_credits function (daily first, then purchased)
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

  if v_last_reset < current_date then
    v_balance := v_daily_limit;
    update public.credits
    set balance = v_daily_limit, last_reset_date = current_date
    where user_id = p_user_id;
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

-- 8. Update get_credit_balance function
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
  end if;

  return json_build_object('balance', v_balance, 'daily_limit', v_daily_limit, 'purchased_credits', v_purchased, 'plan', v_plan);
end;
$$ language plpgsql security definer;

-- 9. Add purchased credits function
create or replace function public.add_purchased_credits(
  p_user_id uuid,
  p_credits int,
  p_purchase_id uuid
)
returns int as $$
declare
  v_new_total int;
begin
  update public.credit_purchases
  set status = 'completed'
  where id = p_purchase_id and user_id = p_user_id;

  update public.credits
  set purchased_credits = purchased_credits + p_credits
  where user_id = p_user_id
  returning purchased_credits into v_new_total;

  if not found then
    insert into public.credits (user_id, balance, purchased_credits, last_reset_date)
    values (p_user_id, 15, p_credits, current_date);
    v_new_total := p_credits;
  end if;

  return v_new_total;
end;
$$ language plpgsql security definer;
