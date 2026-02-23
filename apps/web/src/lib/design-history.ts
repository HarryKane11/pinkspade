export interface DesignHistoryEntry {
  id: string;
  /** base64 data URI of the generated image */
  thumbnail: string;
  format: string;
  label: string;
  /** Brand ID from brand-storage (nullable if no brand was active) */
  brandId: string | null;
  brandName: string | null;
  /** Snapshot of brand colors at time of generation */
  brandColors: string[];
  prompt: string;
  moods: string[];
  productName: string;
  createdAt: string; // ISO string
}

const STORAGE_KEY = 'pinkspade_design_history';
const MAX_ENTRIES = 100;

function readHistory(): DesignHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: DesignHistoryEntry[]) {
  // Trim to max to avoid bloating localStorage
  const trimmed = entries.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full — trim more aggressively
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed.slice(0, 20)));
    } catch {
      // Give up silently
    }
  }
}

export function getAllDesignHistory(): DesignHistoryEntry[] {
  return readHistory();
}

export function saveDesignToHistory(entry: DesignHistoryEntry) {
  const history = readHistory();
  history.unshift(entry);
  writeHistory(history);
}

export function saveDesignsToHistory(entries: DesignHistoryEntry[]) {
  const history = readHistory();
  history.unshift(...entries);
  writeHistory(history);
}

export function removeDesignFromHistory(id: string) {
  const history = readHistory().filter((e) => e.id !== id);
  writeHistory(history);
}

export function getDesignsByBrand(brandId: string): DesignHistoryEntry[] {
  return readHistory().filter((e) => e.brandId === brandId);
}

/** Group all designs by brandId (null grouped as 'no-brand') */
export function getDesignsGroupedByBrand(): Record<string, DesignHistoryEntry[]> {
  const history = readHistory();
  const groups: Record<string, DesignHistoryEntry[]> = {};
  for (const entry of history) {
    const key = entry.brandId ?? 'no-brand';
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}
