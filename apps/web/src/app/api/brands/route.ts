import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Get or auto-create the user's workspace */
async function getOrCreateWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (workspace) return workspace;

  // Auto-create workspace if missing (defensive — the signup trigger should have created it)
  console.warn(`[brands] No workspace for user ${userId}, creating one`);
  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({ name: 'My Workspace', owner_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('[brands] Failed to create workspace:', error);
    return null;
  }
  return newWorkspace;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getOrCreateWorkspace(supabase, user.id);
  if (!workspace) return NextResponse.json({ brands: [] });

  // Get brands with their current DNA
  const { data: brands, error } = await supabase
    .from('brands')
    .select(`
      id, name, website_url, logo_url, created_at, updated_at,
      brand_dna_versions!brands_current_dna_id_fkey (
        dna_data, website_url, extracted_at
      )
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[brands] GET join query failed:', error);
    // Fallback: simple query without join if FK doesn't exist
    const { data: simpleBrands } = await supabase
      .from('brands')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ brands: simpleBrands ?? [] });
  }

  return NextResponse.json({ brands: brands ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { brandName, websiteUrl, colors, typography, tone } = body;

  if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
    return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id);
  if (!workspace) {
    return NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 });
  }

  // Create brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      workspace_id: workspace.id,
      name: brandName,
      website_url: websiteUrl,
    })
    .select()
    .single();

  if (brandError) {
    console.error('[brands] INSERT brand failed:', brandError);
    return NextResponse.json({ error: brandError.message }, { status: 500 });
  }

  // Create DNA version
  const { data: dnaVersion, error: dnaError } = await supabase
    .from('brand_dna_versions')
    .insert({
      brand_id: brand.id,
      version: 1,
      is_current: true,
      dna_data: { colors, typography, tone },
      website_url: websiteUrl,
      extracted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dnaError) {
    console.error('[brands] INSERT brand_dna_versions failed:', dnaError);
    // Brand was created but DNA version failed — still return the brand
    // so the frontend at least has a reference, even without DNA
  }

  if (!dnaError && dnaVersion) {
    // Update brand with current DNA reference
    const { error: updateError } = await supabase
      .from('brands')
      .update({ current_dna_id: dnaVersion.id })
      .eq('id', brand.id);

    if (updateError) {
      console.error('[brands] UPDATE current_dna_id failed:', updateError);
    }
  }

  return NextResponse.json({
    brand: {
      id: brand.id,
      brandName: brand.name,
      websiteUrl: brand.website_url,
      extractedAt: brand.created_at,
      colors,
      typography,
      tone,
    },
  });
}
