-- =====================================================
-- Migration 002: Profiles, Design Fixes, Activity Logs
-- =====================================================

-- =====================================================
-- 1. PROFILES (extends auth.users with app-specific data)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    locale VARCHAR(10) DEFAULT 'ko',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 2. ADD workspace_id TO designs (fixes RLS bug)
-- =====================================================
ALTER TABLE designs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_designs_workspace ON designs(workspace_id);

-- Drop old design RLS and create new one based on workspace_id
DROP POLICY IF EXISTS design_access ON designs;
CREATE POLICY design_access ON designs
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 3. ADD workspace_id TO jobs (enables RLS)
-- =====================================================
ALTER TABLE jobs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
CREATE INDEX idx_jobs_workspace ON jobs(workspace_id);

-- Add RLS policies for jobs
CREATE POLICY jobs_access ON jobs
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 4. ADD RLS for design_versions (was missing)
-- =====================================================
CREATE POLICY design_versions_access ON design_versions
    FOR ALL USING (
        design_id IN (
            SELECT id FROM designs WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
    );

-- =====================================================
-- 5. ADD RLS for exports (through design → workspace)
-- =====================================================
CREATE POLICY exports_access ON exports
    FOR ALL USING (
        design_id IN (
            SELECT id FROM designs WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
    );

-- =====================================================
-- 6. USER ACTIVITY LOGS
-- =====================================================
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),  -- 'brand', 'campaign', 'design', 'export', etc.
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_workspace ON user_activity_logs(workspace_id);
CREATE INDEX idx_activity_action ON user_activity_logs(action);
CREATE INDEX idx_activity_created ON user_activity_logs(created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_access ON user_activity_logs
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 7. AUTO-CREATE profile + workspace ON SIGNUP
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

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 8. CHANNEL PRESETS: Allow public read access
-- =====================================================
ALTER TABLE channel_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY channel_presets_read ON channel_presets
    FOR SELECT USING (true);
