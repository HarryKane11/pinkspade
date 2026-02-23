import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!workspace) return NextResponse.json({ designs: [] });

  const { data: designs } = await supabase
    .from('designs')
    .select('id, brand_id, channel_preset_id, design_json, thumbnail_url, status, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ designs: designs ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { entries } = body as {
    entries: Array<{
      id?: string;
      thumbnail: string;
      format: string;
      label: string;
      brandId: string | null;
      brandName: string | null;
      brandColors: string[];
      channelCategory?: string;
      prompt: string;
      moods: string[];
      productName: string;
    }>;
  };

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
  }

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Validate brand_id exists in the brands table (if provided)
  let validBrandIds: Set<string> = new Set();
  const brandIds = entries.map((e) => e.brandId).filter(Boolean) as string[];
  if (brandIds.length > 0) {
    const { data: brands } = await supabase
      .from('brands')
      .select('id')
      .in('id', brandIds);
    validBrandIds = new Set((brands ?? []).map((b) => b.id));
  }

  const rows = entries.map((entry) => ({
    workspace_id: workspace.id,
    brand_id: entry.brandId && validBrandIds.has(entry.brandId) ? entry.brandId : null,
    channel_preset_id: null, // skip FK — store in design_json instead
    thumbnail_url: entry.thumbnail,
    status: 'completed',
    design_json: {
      format: entry.format,
      label: entry.label,
      brandId: entry.brandId,
      brandName: entry.brandName,
      brandColors: entry.brandColors,
      channelCategory: entry.channelCategory,
      prompt: entry.prompt,
      moods: entry.moods,
      productName: entry.productName,
    },
  }));

  const { data: saved, error } = await supabase
    .from('designs')
    .insert(rows)
    .select('id, brand_id, design_json, thumbnail_url, created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ designs: saved ?? [] });
}
