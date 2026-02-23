-- Add onboarding_data column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- Structure:
-- {
--   "role": "marketer" | "designer" | "founder" | "creator" | "other",
--   "company_size": "1" | "2-10" | "11-50" | "51-200" | "200+",
--   "industries": ["beauty", "fnb", "tech", "ecommerce", ...],
--   "brand_url": "https://example.com",
--   "channels": ["instagram", "kakao", "naver", ...],
--   "goals": ["brand_consistency", "ad_creative", "sns_content", "detail_page", "other"]
-- }
