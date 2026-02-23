-- =====================================================
-- Migration 003: Storage Buckets & Policies
-- =====================================================

-- =====================================================
-- 1. CREATE BUCKETS
-- =====================================================

-- Brand logos (public read for display, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-logos',
    'brand-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

-- Design thumbnails (public read for gallery/sharing, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'design-thumbnails',
    'design-thumbnails',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Design exports (private, auth only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'design-exports',
    'design-exports',
    false,
    52428800, -- 50MB (zip files can be large)
    ARRAY['image/png', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/json', 'application/zip']
);

-- User assets: uploaded images, cutouts, AI backgrounds (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-assets',
    'user-assets',
    false,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

-- =====================================================
-- 2. STORAGE POLICIES
-- =====================================================

-- Helper: extract workspace folder from path
-- Storage paths follow: {workspace_id}/{filename}

-- -----------------------------------------------
-- brand-logos: public read, owner write
-- -----------------------------------------------
CREATE POLICY "brand_logos_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-logos');

CREATE POLICY "brand_logos_auth_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "brand_logos_auth_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'brand-logos'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "brand_logos_auth_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'brand-logos'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- design-thumbnails: public read, owner write
-- -----------------------------------------------
CREATE POLICY "design_thumbnails_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'design-thumbnails');

CREATE POLICY "design_thumbnails_auth_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'design-thumbnails'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "design_thumbnails_auth_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'design-thumbnails'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "design_thumbnails_auth_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'design-thumbnails'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- design-exports: owner only (read/write)
-- -----------------------------------------------
CREATE POLICY "design_exports_auth_select"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'design-exports'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "design_exports_auth_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'design-exports'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "design_exports_auth_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'design-exports'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- user-assets: owner only (read/write)
-- -----------------------------------------------
CREATE POLICY "user_assets_auth_select"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'user-assets'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "user_assets_auth_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-assets'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "user_assets_auth_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'user-assets'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "user_assets_auth_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'user-assets'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
        )
    );
