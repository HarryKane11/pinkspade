export interface DesignHistoryEntry {
  id: string;
  /** URL or base64 data URI of the generated image */
  thumbnail: string;
  format: string;
  label: string;
  /** Brand ID from brand-storage (nullable if no brand was active) */
  brandId: string | null;
  brandName: string | null;
  /** Snapshot of brand colors at time of generation */
  brandColors: string[];
  /** Channel category (e.g. 'instagram', 'youtube', 'naver') */
  channelCategory?: string;
  prompt: string;
  moods: string[];
  productName: string;
  createdAt: string; // ISO string
}

/* ── Supabase row → DesignHistoryEntry ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseRow(row: any): DesignHistoryEntry {
  const dj = row.design_json ?? {};
  return {
    id: row.id,
    thumbnail: row.thumbnail_url ?? '',
    format: dj.format ?? '',
    label: dj.label ?? '',
    brandId: dj.brandId ?? row.brand_id ?? null,
    brandName: dj.brandName ?? null,
    brandColors: dj.brandColors ?? [],
    channelCategory: dj.channelCategory,
    prompt: dj.prompt ?? '',
    moods: dj.moods ?? [],
    productName: dj.productName ?? '',
    createdAt: row.created_at ?? '',
  };
}

/* ── localStorage fallback ── */

const STORAGE_KEY = 'pinkspade_design_history';
const MAX_ENTRIES = 100;

function readLocal(): DesignHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: DesignHistoryEntry[]) {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed.slice(0, 20)));
    } catch { /* give up */ }
  }
}

/* ── Public API (async, Supabase-first with localStorage fallback) ── */

export async function getAllDesignHistory(): Promise<DesignHistoryEntry[]> {
  try {
    const res = await fetch('/api/designs');
    if (res.status === 401) return readLocal();
    if (!res.ok) return readLocal();
    const { designs } = await res.json();
    return (designs ?? []).map(fromSupabaseRow);
  } catch {
    return readLocal();
  }
}

export async function saveDesignsToHistory(entries: DesignHistoryEntry[]): Promise<void> {
  // Always write to localStorage as cache
  const local = readLocal();
  local.unshift(...entries);
  writeLocal(local);

  try {
    const res = await fetch('/api/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    // 401 = not logged in, localStorage is the only store
    if (res.status === 401) return;
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error('saveDesignsToHistory: Supabase save failed:', res.status, errBody);
    }
  } catch (err) {
    console.error('saveDesignsToHistory: network error:', err);
  }
}

export async function removeDesignFromHistory(id: string): Promise<void> {
  // Remove from localStorage cache
  writeLocal(readLocal().filter((e) => e.id !== id));

  try {
    const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
    if (res.status === 401) return;
  } catch { /* ignore */ }
}

/** Group designs by brandId → channelCategory → entries */
export async function getDesignsGroupedByBrandAndChannel(): Promise<
  Record<string, Record<string, DesignHistoryEntry[]>>
> {
  const history = await getAllDesignHistory();
  const groups: Record<string, Record<string, DesignHistoryEntry[]>> = {};
  for (const entry of history) {
    const brandKey = entry.brandId ?? 'no-brand';
    const channelKey = entry.channelCategory || 'uncategorized';
    if (!groups[brandKey]) groups[brandKey] = {};
    if (!groups[brandKey][channelKey]) groups[brandKey][channelKey] = [];
    groups[brandKey][channelKey].push(entry);
  }
  return groups;
}
