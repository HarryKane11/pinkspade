-- Remove unused tables: templates, campaign_ideas, jobs, exports
-- These tables were created in 001_initial_schema.sql but never integrated with any API routes.

-- Drop RLS policies first
DROP POLICY IF EXISTS template_access ON templates;
DROP POLICY IF EXISTS campaign_ideas_access ON campaign_ideas;

-- Drop triggers
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_campaign_ideas_updated_at ON campaign_ideas;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;

-- Drop indexes
DROP INDEX IF EXISTS idx_templates_channel;
DROP INDEX IF EXISTS idx_campaign_ideas_campaign;
DROP INDEX IF EXISTS idx_jobs_workspace;
DROP INDEX IF EXISTS idx_jobs_status;

-- Drop tables (CASCADE handles remaining FKs)
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS campaign_ideas CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS exports CASCADE;
