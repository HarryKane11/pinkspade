import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { designJson, name, thumbnailUrl } = body as {
    designJson?: unknown;
    name?: string;
    thumbnailUrl?: string;
  };

  if (!designJson && !name && !thumbnailUrl) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // Get user's workspace for ownership check
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (designJson !== undefined) update.design_json = designJson;
  if (name) update.name = name;
  if (thumbnailUrl) update.thumbnail_url = thumbnailUrl;

  const { data, error } = await supabase
    .from('designs')
    .update(update)
    .eq('id', id)
    .eq('workspace_id', workspace.id) // ownership check
    .select('id, design_json, name, thumbnail_url, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  return NextResponse.json({ design: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('designs').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
