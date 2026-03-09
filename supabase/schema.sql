-- ============================================
-- Writing Prompt Generator - Credit System Schema
-- ============================================

-- 1. User profiles (synced from Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text not null default 'free' check (plan in ('free', 'basic', 'pro', 'power')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Credits table
create table if not exists public.credits (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  balance int not null default 15,
  purchased_credits int not null default 0,
  last_reset_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. Usage log
create table if not exists public.usage_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  credits_used int not null,
  source text not null default 'daily',
  created_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_usage_log_user_date on public.usage_log(user_id, created_at);

-- 4. Generated prompts (saved works)
create table if not exists public.generated_prompts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  input_text text,
  category text not null default 'writing',
  enhanced_options jsonb,
  prompt text not null,
  generated_content text,
  model_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_prompts_user on public.generated_prompts(user_id, created_at desc);

-- 5. Credit purchases (one-time packs)
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

-- ============================================
-- Functions
-- ============================================

-- Auto-create profile + credits on user signup
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

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Check and deduct credits (atomic operation)
-- Priority: daily credits first, then purchased credits
-- Returns remaining total balance, or -1 if insufficient
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
  -- Get user plan
  select plan into v_plan from public.profiles where id = p_user_id;
  if not found then return -1; end if;

  -- Determine daily limit based on plan
  v_daily_limit := case v_plan
    when 'free' then 15
    when 'basic' then 60
    when 'pro' then 200
    when 'power' then 999999
    else 15
  end;

  -- Lock the credits row
  select balance, purchased_credits, last_reset_date into v_balance, v_purchased, v_last_reset
  from public.credits
  where user_id = p_user_id
  for update;

  if not found then
    -- Create credits row if missing
    insert into public.credits (user_id, balance, purchased_credits, last_reset_date)
    values (p_user_id, v_daily_limit, 0, current_date);
    v_balance := v_daily_limit;
    v_purchased := 0;
    v_last_reset := current_date;
  end if;

  -- Reset daily credits if new day (purchased credits never reset)
  if v_last_reset < current_date then
    v_balance := v_daily_limit;
    update public.credits
    set balance = v_daily_limit, last_reset_date = current_date
    where user_id = p_user_id;
  end if;

  -- Check total sufficient balance
  if (v_balance + v_purchased) < p_cost then
    return -1;
  end if;

  -- Deduct: daily credits first, then purchased
  v_remaining_cost := p_cost;

  if v_balance >= v_remaining_cost then
    -- All from daily
    update public.credits
    set balance = balance - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'daily';
    v_balance := v_balance - v_remaining_cost;
  elsif v_balance > 0 then
    -- Partial from daily, rest from purchased
    v_remaining_cost := v_remaining_cost - v_balance;
    update public.credits
    set balance = 0, purchased_credits = purchased_credits - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'mixed';
    v_purchased := v_purchased - v_remaining_cost;
    v_balance := 0;
  else
    -- All from purchased
    update public.credits
    set purchased_credits = purchased_credits - v_remaining_cost
    where user_id = p_user_id;
    v_source := 'purchased';
    v_purchased := v_purchased - v_remaining_cost;
  end if;

  -- Log usage
  insert into public.usage_log (user_id, action, credits_used, source)
  values (p_user_id, p_action, p_cost, v_source);

  return v_balance + v_purchased;
end;
$$ language plpgsql security definer;

-- Get current balance (with auto-reset)
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

  -- Auto-reset daily credits on new day
  if v_last_reset < current_date then
    update public.credits
    set balance = v_daily_limit, last_reset_date = current_date
    where user_id = p_user_id;
    v_balance := v_daily_limit;
  end if;

  return json_build_object('balance', v_balance, 'daily_limit', v_daily_limit, 'purchased_credits', v_purchased, 'plan', v_plan);
end;
$$ language plpgsql security definer;

-- Add purchased credits after successful payment
create or replace function public.add_purchased_credits(
  p_user_id uuid,
  p_credits int,
  p_purchase_id uuid
)
returns int as $$
declare
  v_new_total int;
begin
  -- Update purchase status
  update public.credit_purchases
  set status = 'completed'
  where id = p_purchase_id and user_id = p_user_id;

  -- Add credits
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

-- ============================================
-- Row Level Security
-- ============================================

alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.usage_log enable row level security;

-- Users can only read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only read their own credits
create policy "Users can view own credits"
  on public.credits for select
  using (auth.uid() = user_id);

-- Users can only view their own usage
create policy "Users can view own usage"
  on public.usage_log for select
  using (auth.uid() = user_id);

alter table public.generated_prompts enable row level security;

-- Users can view their own generated prompts
create policy "Users can view own prompts"
  on public.generated_prompts for select
  using (auth.uid() = user_id);

-- Users can insert their own generated prompts
create policy "Users can insert own prompts"
  on public.generated_prompts for insert
  with check (auth.uid() = user_id);

-- Users can delete their own generated prompts
create policy "Users can delete own prompts"
  on public.generated_prompts for delete
  using (auth.uid() = user_id);

-- Users can update their own generated prompts
create policy "Users can update own prompts"
  on public.generated_prompts for update
  using (auth.uid() = user_id);

-- 6. Generated contents (saved generated text from "Generate Content" and "Continue")
create table if not exists public.generated_contents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prompt_id uuid references public.generated_prompts(id) on delete set null,
  input_prompt text,
  content text not null,
  model_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_contents_user on public.generated_contents(user_id, created_at desc);

alter table public.generated_contents enable row level security;

create policy "Users can view own contents"
  on public.generated_contents for select
  using (auth.uid() = user_id);

create policy "Users can insert own contents"
  on public.generated_contents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own contents"
  on public.generated_contents for delete
  using (auth.uid() = user_id);

create policy "Users can update own contents"
  on public.generated_contents for update
  using (auth.uid() = user_id);

-- Credit purchases RLS
alter table public.credit_purchases enable row level security;

create policy "Users can view own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);
