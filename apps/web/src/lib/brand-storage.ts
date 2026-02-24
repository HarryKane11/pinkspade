export interface StoredBrandDna {
  id: string;
  brandName: string;
  websiteUrl: string;
  extractedAt: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    palette?: string[];
  };
  typography: {
    heading?: string;
    body?: string;
    style?: string;
  };
  tone: {
    keywords?: string[];
    metrics?: Record<string, number>;
    voiceDescription?: string;
  };
}

/* ── Supabase row → StoredBrandDna ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseRow(row: any): StoredBrandDna {
  const dna = row.brand_dna_versions?.dna_data ?? {};
  return {
    id: row.id,
    brandName: row.name ?? '',
    websiteUrl: row.website_url ?? row.brand_dna_versions?.website_url ?? '',
    extractedAt: row.brand_dna_versions?.extracted_at ?? row.created_at ?? '',
    colors: dna.colors ?? {},
    typography: dna.typography ?? {},
    tone: dna.tone ?? {},
  };
}

/* ── localStorage fallback (for unauthenticated / offline) ── */

const STORAGE_KEY = 'pinkspade_brands';

function readLocal(): StoredBrandDna[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(brands: StoredBrandDna[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  } catch { /* ignore */ }
}

/* ── Public API (async, Supabase-first with localStorage fallback) ── */

export async function getAllBrands(): Promise<StoredBrandDna[]> {
  try {
    const res = await fetch('/api/brands');
    if (res.status === 401) return readLocal();
    if (!res.ok) return readLocal();
    const { brands } = await res.json();
    const mapped = (brands ?? []).map(fromSupabaseRow);
    // Sync to localStorage cache
    writeLocal(mapped);
    return mapped;
  } catch {
    return readLocal();
  }
}

export async function saveBrand(
  brand: Omit<StoredBrandDna, 'id'> & { id?: string }
): Promise<StoredBrandDna | null> {
  const toLocal = (): StoredBrandDna => ({
    id: brand.id ?? crypto.randomUUID(),
    brandName: brand.brandName,
    websiteUrl: brand.websiteUrl,
    extractedAt: brand.extractedAt ?? new Date().toISOString(),
    colors: brand.colors,
    typography: brand.typography,
    tone: brand.tone,
  });

  const saveLocal = (entry: StoredBrandDna) => {
    const brands = readLocal();
    brands.unshift(entry);
    writeLocal(brands);
    return entry;
  };

  try {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandName: brand.brandName,
        websiteUrl: brand.websiteUrl,
        colors: brand.colors,
        typography: brand.typography,
        tone: brand.tone,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[saveBrand] API error ${res.status}: ${body}`);
      return saveLocal(toLocal());
    }

    const { brand: saved } = await res.json();
    const result: StoredBrandDna = {
      id: saved.id,
      brandName: saved.brandName ?? brand.brandName,
      websiteUrl: saved.websiteUrl ?? brand.websiteUrl,
      extractedAt: saved.extractedAt ?? new Date().toISOString(),
      colors: brand.colors,
      typography: brand.typography,
      tone: brand.tone,
    };
    // Update localStorage cache
    const locals = readLocal();
    locals.unshift(result);
    writeLocal(locals);
    return result;
  } catch (err) {
    console.error('[saveBrand] Network error, falling back to localStorage:', err);
    return saveLocal(toLocal());
  }
}

export async function removeBrand(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      // Fallback: remove from localStorage
      writeLocal(readLocal().filter((b) => b.id !== id));
      return;
    }
  } catch { /* ignore */ }
  // Also remove from local cache
  writeLocal(readLocal().filter((b) => b.id !== id));
}

export async function getBrandById(id: string): Promise<StoredBrandDna | undefined> {
  try {
    const res = await fetch(`/api/brands/${id}`);
    if (res.status === 401) return readLocal().find((b) => b.id === id);
    if (!res.ok) return readLocal().find((b) => b.id === id);
    const { brand } = await res.json();
    return brand ? fromSupabaseRow(brand) : undefined;
  } catch {
    return readLocal().find((b) => b.id === id);
  }
}

export async function getLatestBrand(): Promise<StoredBrandDna | undefined> {
  const brands = await getAllBrands();
  return brands[0];
}
