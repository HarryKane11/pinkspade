-- =====================================================
-- Migration 005: Credits System
-- =====================================================

-- =====================================================
-- 1. CREDIT BALANCES (current balance per user)
-- =====================================================
CREATE TABLE credit_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 500,
    monthly_quota INTEGER NOT NULL DEFAULT 500,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_balances_select ON credit_balances
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY credit_balances_update ON credit_balances
    FOR UPDATE USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_credit_balances_updated_at BEFORE UPDATE ON credit_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 2. CREDIT LEDGER (append-only transaction log)
-- =====================================================
CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = credit, negative = debit
    type VARCHAR(50) NOT NULL CHECK (type IN ('generation', 'copy', 'signup_bonus', 'monthly_reset', 'purchase', 'refund', 'admin')),
    model_id VARCHAR(100), -- which AI model was used (null for non-generation)
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_ledger_user ON credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_user_created ON credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_credit_ledger_type ON credit_ledger(type);

ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_ledger_select ON credit_ledger
    FOR SELECT USING (user_id = auth.uid());

-- Insert policy: only server-side (service_role) can insert
CREATE POLICY credit_ledger_insert ON credit_ledger
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. ATOMIC DEDUCT CREDITS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_type VARCHAR(50),
    p_model_id VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT balance INTO current_balance
    FROM credit_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- If no balance record exists, create one with default
    IF current_balance IS NULL THEN
        INSERT INTO credit_balances (user_id, balance, monthly_quota, plan)
        VALUES (p_user_id, 500, 500, 'free')
        ON CONFLICT (user_id) DO NOTHING;
        current_balance := 500;
    END IF;

    -- Check sufficient balance
    IF current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'balance', current_balance,
            'required', p_amount
        );
    END IF;

    -- Deduct
    new_balance := current_balance - p_amount;
    UPDATE credit_balances SET balance = new_balance WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO credit_ledger (user_id, amount, type, model_id, description)
    VALUES (p_user_id, -p_amount, p_type, p_model_id, p_description);

    RETURN jsonb_build_object(
        'success', true,
        'balance', new_balance,
        'deducted', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. AUTO-CREATE credit_balances ON PROFILE CREATION
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Create profile from Google OAuth metadata
    INSERT INTO public.profiles (id, display_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );

    -- Create default workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace') || '''s Workspace',
        NEW.id
    )
    RETURNING id INTO new_workspace_id;

    -- Create credit balance with signup bonus
    INSERT INTO public.credit_balances (user_id, balance, monthly_quota, plan)
    VALUES (NEW.id, 500, 500, 'free');

    -- Log signup bonus in ledger
    INSERT INTO public.credit_ledger (user_id, amount, type, description)
    VALUES (NEW.id, 500, 'signup_bonus', 'Welcome bonus: 500 free credits');

    -- Log signup activity
    INSERT INTO public.user_activity_logs (user_id, workspace_id, action, resource_type, metadata)
    VALUES (
        NEW.id,
        new_workspace_id,
        'signup',
        'user',
        jsonb_build_object(
            'provider', NEW.raw_app_meta_data->>'provider',
            'email', NEW.email
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. MONTHLY CREDIT RESET FUNCTION (call via cron)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
    -- Reset balances for users whose reset_at has passed
    UPDATE credit_balances
    SET
        balance = monthly_quota,
        reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE reset_at <= NOW();

    -- Log resets in ledger
    INSERT INTO credit_ledger (user_id, amount, type, description)
    SELECT
        user_id,
        monthly_quota,
        'monthly_reset',
        'Monthly credit reset'
    FROM credit_balances
    WHERE reset_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
