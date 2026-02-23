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

  const { data: brand, error } = await supabase
    .from('brands')
    .select(`
      id, name, website_url, logo_url, created_at, updated_at,
      brand_dna_versions!brands_current_dna_id_fkey (
        dna_data, website_url, extracted_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    // Fallback without join
    const { data: simpleBrand } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();
    return simpleBrand
      ? NextResponse.json({ brand: simpleBrand })
      : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ brand });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete DNA versions first (FK constraint)
  await supabase.from('brand_dna_versions').delete().eq('brand_id', id);

  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
