-- ============================================
-- Migration: Add stripe_subscription_id to profiles
-- Run this on existing databases
-- ============================================

alter table public.profiles
  add column if not exists stripe_subscription_id text;
