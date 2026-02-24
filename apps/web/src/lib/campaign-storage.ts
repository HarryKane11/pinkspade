export interface StoredCampaign {
  id: string;
  name: string;
  brandId: string | null;
  brandName: string | null;
  prompt: string;
  status: 'draft' | 'completed';
  targetChannels: string[];
  moods: string[];
  modelId: string;
  variationCount: number;
  headline: string;
  description: string;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/* ── Supabase row → StoredCampaign ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseRow(row: any): StoredCampaign {
  const meta = row.metadata ?? {};
  const brandName = row.brands?.name ?? meta.data?.brandDna?.brandName ?? null;
  const campaignData = meta.data ?? {};
  return {
    id: row.id,
    name: row.name ?? '',
    brandId: row.brand_id ?? null,
    brandName,
    prompt: row.prompt ?? '',
    status: row.status ?? 'draft',
    targetChannels: row.target_channels ?? [],
    moods: campaignData.moods ?? [],
    modelId: campaignData.modelId ?? 'flux-dev',
    variationCount: campaignData.variationCount ?? 3,
    headline: campaignData.headline ?? '',
    description: campaignData.description ?? '',
    thumbnailUrl: campaignData.concepts?.[0]?.assets?.[0]?.imageUrl ?? null,
    metadata: meta,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

/* ── localStorage fallback (for unauthenticated / offline) ── */

const STORAGE_KEY = 'pinkspade_campaigns';

function readLocal(): StoredCampaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(campaigns: StoredCampaign[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch { /* ignore */ }
}

/* ── Public API (async, Supabase-first with localStorage fallback) ── */

export async function getAllCampaigns(): Promise<StoredCampaign[]> {
  try {
    const res = await fetch('/api/campaigns');
    if (res.status === 401) return readLocal();
    if (!res.ok) return readLocal();
    const { campaigns } = await res.json();
    const mapped = (campaigns ?? []).map(fromSupabaseRow);
    writeLocal(mapped);
    return mapped;
  } catch {
    return readLocal();
  }
}

export async function saveCampaign(
  campaign: Omit<StoredCampaign, 'id' | 'createdAt' | 'updatedAt' | 'thumbnailUrl' | 'brandName'> & { id?: string }
): Promise<StoredCampaign | null> {
  const toLocal = (): StoredCampaign => ({
    id: campaign.id ?? crypto.randomUUID(),
    name: campaign.name,
    brandId: campaign.brandId,
    brandName: null,
    prompt: campaign.prompt,
    status: campaign.status,
    targetChannels: campaign.targetChannels,
    moods: campaign.moods,
    modelId: campaign.modelId,
    variationCount: campaign.variationCount,
    headline: campaign.headline,
    description: campaign.description,
    thumbnailUrl: null,
    metadata: campaign.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const saveLocal = (entry: StoredCampaign) => {
    const campaigns = readLocal();
    const idx = campaigns.findIndex((c) => c.id === entry.id);
    if (idx >= 0) {
      campaigns[idx] = entry;
    } else {
      campaigns.unshift(entry);
    }
    writeLocal(campaigns);
    return entry;
  };

  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: campaign.id,
        name: campaign.name,
        brandId: campaign.brandId,
        prompt: campaign.prompt,
        status: campaign.status,
        targetChannels: campaign.targetChannels,
        metadata: campaign.metadata,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[saveCampaign] API error ${res.status}: ${body}`);
      return saveLocal(toLocal());
    }

    const { campaign: saved } = await res.json();
    const result = fromSupabaseRow(saved);
    const locals = readLocal();
    const idx = locals.findIndex((c) => c.id === result.id);
    if (idx >= 0) {
      locals[idx] = result;
    } else {
      locals.unshift(result);
    }
    writeLocal(locals);
    return result;
  } catch (err) {
    console.error('[saveCampaign] Network error, falling back to localStorage:', err);
    return saveLocal(toLocal());
  }
}

export async function getCampaignById(id: string): Promise<StoredCampaign | undefined> {
  try {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.status === 401) return readLocal().find((c) => c.id === id);
    if (!res.ok) return readLocal().find((c) => c.id === id);
    const { campaign } = await res.json();
    return campaign ? fromSupabaseRow(campaign) : undefined;
  } catch {
    return readLocal().find((c) => c.id === id);
  }
}

export async function removeCampaign(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      writeLocal(readLocal().filter((c) => c.id !== id));
      return;
    }
  } catch { /* ignore */ }
  writeLocal(readLocal().filter((c) => c.id !== id));
}
