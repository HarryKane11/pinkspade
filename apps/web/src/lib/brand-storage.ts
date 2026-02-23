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

const STORAGE_KEY = 'pinkspade_brands';

function readBrands(): StoredBrandDna[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeBrands(brands: StoredBrandDna[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

export function getAllBrands(): StoredBrandDna[] {
  return readBrands();
}

export function saveBrand(brand: StoredBrandDna) {
  const brands = readBrands();
  const idx = brands.findIndex((b) => b.id === brand.id);
  if (idx >= 0) {
    brands[idx] = brand;
  } else {
    brands.unshift(brand);
  }
  writeBrands(brands);
}

export function removeBrand(id: string) {
  const brands = readBrands().filter((b) => b.id !== id);
  writeBrands(brands);
}

export function getBrandById(id: string): StoredBrandDna | undefined {
  return readBrands().find((b) => b.id === id);
}

export function getLatestBrand(): StoredBrandDna | undefined {
  return readBrands()[0];
}
