-- BrandFlow Studio Database Schema
-- Supabase PostgreSQL with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WORKSPACES
-- =====================================================
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BRANDS
-- =====================================================
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    current_dna_id UUID, -- Will be foreign key after brand_dna_versions created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brands_workspace ON brands(workspace_id);

-- =====================================================
-- BRAND DNA VERSIONS
-- =====================================================
CREATE TABLE brand_dna_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,

    -- Brand DNA data as JSONB
    dna_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure:
    -- {
    --   "name": "브랜드명",
    --   "tagline": "태그라인",
    --   "colors": { "primary": "#...", "secondary": "#...", ... },
    --   "typography": { "headingFont": "...", "bodyFont": "...", ... },
    --   "tone": { "style": "...", "description": "...", "keywords": [...] },
    --   "imageStyle": { "style": "...", "colorTones": [...], ... }
    -- }

    website_url TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(brand_id, version)
);

CREATE INDEX idx_brand_dna_brand ON brand_dna_versions(brand_id);
CREATE INDEX idx_brand_dna_current ON brand_dna_versions(brand_id, is_current) WHERE is_current = TRUE;

-- Add foreign key after table created
ALTER TABLE brands ADD CONSTRAINT fk_brands_current_dna
    FOREIGN KEY (current_dna_id) REFERENCES brand_dna_versions(id);

-- =====================================================
-- CHANNEL PRESETS
-- =====================================================
CREATE TABLE channel_presets (
    id VARCHAR(100) PRIMARY KEY,
    name_ko VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Korean market presets
INSERT INTO channel_presets (id, name_ko, name_en, width, height, aspect_ratio, category) VALUES
('instagram_feed_1_1', '인스타그램 피드 (정사각)', 'Instagram Feed Square', 1080, 1080, '1:1', 'instagram'),
('instagram_feed_4_5', '인스타그램 피드 (세로)', 'Instagram Feed Portrait', 1080, 1350, '4:5', 'instagram'),
('instagram_story', '인스타그램 스토리', 'Instagram Story', 1080, 1920, '9:16', 'instagram'),
('instagram_reels', '인스타그램 릴스', 'Instagram Reels', 1080, 1920, '9:16', 'instagram'),
('kakao_channel_square', '카카오 채널 (정사각)', 'Kakao Channel Square', 800, 800, '1:1', 'kakao'),
('kakao_talk_wide', '카카오톡 와이드형', 'KakaoTalk Wide', 800, 400, '2:1', 'kakao'),
('kakao_banner', '카카오 비즈보드 배너', 'Kakao Biz Board Banner', 1029, 258, '4:1', 'kakao'),
('naver_shopping', '네이버 쇼핑 상품', 'Naver Shopping Product', 1000, 1000, '1:1', 'naver'),
('naver_blog_thumbnail', '네이버 블로그 썸네일', 'Naver Blog Thumbnail', 1200, 630, '1.91:1', 'naver'),
('naver_smartstore', '네이버 스마트스토어', 'Naver Smartstore', 860, 860, '1:1', 'naver'),
('naver_search_ad', '네이버 검색광고', 'Naver Search Ad', 300, 250, '6:5', 'naver'),
('coupang_product', '쿠팡 상품 이미지', 'Coupang Product', 500, 500, '1:1', 'coupang'),
('coupang_detail', '쿠팡 상세페이지', 'Coupang Detail', 860, 1200, '43:60', 'coupang'),
('google_display_300x250', '구글 디스플레이 중형', 'Google Display Medium Rectangle', 300, 250, '6:5', 'google'),
('google_display_728x90', '구글 디스플레이 리더보드', 'Google Display Leaderboard', 728, 90, '728:90', 'google'),
('youtube_thumbnail', '유튜브 썸네일', 'YouTube Thumbnail', 1280, 720, '16:9', 'youtube'),
('youtube_channel_banner', '유튜브 채널 배너', 'YouTube Channel Banner', 2560, 1440, '16:9', 'youtube'),
('facebook_post', '페이스북 게시물', 'Facebook Post', 1200, 630, '1.91:1', 'facebook'),
('facebook_story', '페이스북 스토리', 'Facebook Story', 1080, 1920, '9:16', 'facebook'),
('twitter_post', 'X(트위터) 게시물', 'Twitter/X Post', 1200, 675, '16:9', 'twitter'),
('linkedin_post', '링크드인 게시물', 'LinkedIn Post', 1200, 627, '1.91:1', 'linkedin');

-- =====================================================
-- TEMPLATES
-- =====================================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_preset_id VARCHAR(100) REFERENCES channel_presets(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    design_json JSONB NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_workspace ON templates(workspace_id);
CREATE INDEX idx_templates_channel ON templates(channel_preset_id);

-- =====================================================
-- CAMPAIGNS
-- =====================================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    target_channels TEXT[], -- Array of channel preset IDs
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_brand ON campaigns(brand_id);

-- =====================================================
-- CAMPAIGN IDEAS
-- =====================================================
CREATE TABLE campaign_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_preset_id VARCHAR(100) REFERENCES channel_presets(id),

    -- Idea content
    title VARCHAR(255) NOT NULL,
    concept TEXT,
    target_message TEXT,
    visual_direction TEXT,

    -- Copy pack as JSONB
    copy_pack JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure:
    -- {
    --   "headline": { "original": "...", "shorter": "...", "formal": "...", ... },
    --   "description": { "original": "...", ... },
    --   "cta": { "original": "...", ... }
    -- }

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_ideas_campaign ON campaign_ideas(campaign_id);

-- =====================================================
-- DESIGNS
-- =====================================================
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    channel_preset_id VARCHAR(100) REFERENCES channel_presets(id),

    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    current_version INTEGER DEFAULT 1,
    thumbnail_url TEXT,

    -- Current design JSON
    design_json JSONB NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_designs_campaign ON designs(campaign_id);
CREATE INDEX idx_designs_brand ON designs(brand_id);

-- =====================================================
-- DESIGN VERSIONS (for history/undo)
-- =====================================================
CREATE TABLE design_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    design_json JSONB NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(design_id, version)
);

CREATE INDEX idx_design_versions_design ON design_versions(design_id);

-- =====================================================
-- ASSETS
-- =====================================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL, -- 'image', 'cutout', 'background', 'logo'
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Original upload info
    original_filename VARCHAR(255),

    -- Processed versions
    thumbnail_url TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_workspace ON assets(workspace_id);
CREATE INDEX idx_assets_type ON assets(type);

-- =====================================================
-- JOBS (background processing)
-- =====================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,

    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,

    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);

-- =====================================================
-- EXPORTS
-- =====================================================
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,

    format VARCHAR(50) NOT NULL, -- 'png', 'pptx', 'json', 'zip'
    status VARCHAR(50) DEFAULT 'pending',

    file_url TEXT,
    file_size INTEGER,

    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_exports_design ON exports(design_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_dna_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Workspace access policy
CREATE POLICY workspace_access ON workspaces
    FOR ALL USING (owner_id = auth.uid());

-- Brand access through workspace
CREATE POLICY brand_access ON brands
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- Brand DNA access through brand
CREATE POLICY brand_dna_access ON brand_dna_versions
    FOR ALL USING (
        brand_id IN (
            SELECT id FROM brands WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
    );

-- Campaign access through workspace
CREATE POLICY campaign_access ON campaigns
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- Campaign ideas access through campaign
CREATE POLICY campaign_ideas_access ON campaign_ideas
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
    );

-- Design access through workspace (via brand or campaign)
CREATE POLICY design_access ON designs
    FOR ALL USING (
        brand_id IN (
            SELECT id FROM brands WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
        OR campaign_id IN (
            SELECT id FROM campaigns WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
            )
        )
    );

-- Template access (system templates are public, user templates through workspace)
CREATE POLICY template_access ON templates
    FOR ALL USING (
        is_system = TRUE
        OR workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- Asset access through workspace
CREATE POLICY asset_access ON assets
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_dna_updated_at BEFORE UPDATE ON brand_dna_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
