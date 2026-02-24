import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getOrCreateWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (workspace) return workspace;

  console.warn(`[campaigns] No workspace for user ${userId}, creating one`);
  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({ name: 'My Workspace', owner_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('[campaigns] Failed to create workspace:', error);
    return null;
  }
  return newWorkspace;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await getOrCreateWorkspace(supabase, user.id);
  if (!workspace) return NextResponse.json({ campaigns: [] });

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*, brands(name)')
    .eq('workspace_id', workspace.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[campaigns] GET query failed:', error);
    const { data: simpleCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false });
    return NextResponse.json({ campaigns: simpleCampaigns ?? [] });
  }

  return NextResponse.json({ campaigns: campaigns ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, name, brandId, prompt, status, targetChannels, metadata } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id);
  if (!workspace) {
    return NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 });
  }

  // Upsert: update if id provided, insert otherwise
  if (id) {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        name,
        brand_id: brandId || null,
        prompt: prompt ?? '',
        status: status ?? 'draft',
        target_channels: targetChannels ?? [],
        metadata: metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .select('*, brands(name)')
      .single();

    if (error) {
      console.error('[campaigns] UPDATE failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      workspace_id: workspace.id,
      name,
      brand_id: brandId || null,
      prompt: prompt ?? '',
      status: status ?? 'draft',
      target_channels: targetChannels ?? [],
      metadata: metadata ?? {},
    })
    .select('*, brands(name)')
    .single();

  if (error) {
    console.error('[campaigns] INSERT failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}
