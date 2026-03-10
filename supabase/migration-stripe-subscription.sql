-- ============================================
-- Migration: Add stripe_subscription_id to profiles
-- Run this on existing databases
-- ============================================

-- Add stripe_subscription_id column
alter table public.profiles add column if not exists stripe_subscription_id text;
