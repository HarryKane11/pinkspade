-- =====================================================
-- Migration 008: Backfill 500 free credits for all existing users
-- =====================================================
-- Existing users who signed up before the credit system
-- don't have credit_balances rows. This backfills them.

-- 1. Insert credit_balances for users who don't have one yet
INSERT INTO credit_balances (user_id, balance, monthly_quota, plan)
SELECT id, 500, 500, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM credit_balances)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Log the signup bonus in credit_ledger for those users
INSERT INTO credit_ledger (user_id, amount, type, description)
SELECT id, 500, 'signup_bonus', 'Welcome bonus: 500 free credits (backfill)'
FROM auth.users
WHERE id NOT IN (
    SELECT DISTINCT user_id FROM credit_ledger WHERE type = 'signup_bonus'
);
