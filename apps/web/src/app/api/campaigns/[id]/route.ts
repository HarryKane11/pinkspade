import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, brands(name)')
    .eq('id', id)
    .single();

  if (error) {
    const { data: simpleCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    return simpleCampaign
      ? NextResponse.json({ campaign: simpleCampaign })
      : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, brandId, prompt, status, targetChannels, metadata } = body;

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .update({
      ...(name !== undefined && { name }),
      ...(brandId !== undefined && { brand_id: brandId || null }),
      ...(prompt !== undefined && { prompt }),
      ...(status !== undefined && { status }),
      ...(targetChannels !== undefined && { target_channels: targetChannels }),
      ...(metadata !== undefined && { metadata }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, brands(name)')
    .single();

  if (error) {
    console.error('[campaigns] PUT failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
