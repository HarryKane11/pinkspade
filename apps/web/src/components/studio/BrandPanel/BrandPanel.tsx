'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Palette, Type, Sparkles, Check, ExternalLink } from 'lucide-react';
import { getLatestBrand, type StoredBrandDna } from '@/lib/brand-storage';

export function BrandPanel() {
  const [brand, setBrand] = useState<StoredBrandDna | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    const loadBrand = async () => {
      // Try sessionStorage first (current session)
      try {
        const session = sessionStorage.getItem('brandDna');
        const url = sessionStorage.getItem('brandDnaUrl');
        if (session) {
          const dna = JSON.parse(session);
          setBrand({
            id: 'session',
            brandName: dna.brandName || url || 'Brand',
            websiteUrl: url || '',
            extractedAt: new Date().toISOString(),
            colors: dna.colors ?? {},
            typography: dna.typography ?? {},
            tone: dna.tone ?? {},
          });
          return;
        }
      } catch { /* ignore */ }

      // Fallback to Supabase (most recent brand)
      const latest = await getLatestBrand();
      if (latest) {
        setBrand(latest);
        // Also load into sessionStorage for other components
        try {
          sessionStorage.setItem('brandDna', JSON.stringify({
            brandName: latest.brandName,
            colors: latest.colors,
            typography: latest.typography,
            tone: latest.tone,
          }));
          sessionStorage.setItem('brandDnaUrl', latest.websiteUrl);
          sessionStorage.setItem('activeBrandId', latest.id);
        } catch { /* ignore */ }
      }
    };

    loadBrand();

    // Listen for storage changes (e.g. brand extracted in another tab or modal)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pinkspade_brands' || e.key === 'brandDna') {
        loadBrand();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  }, []);

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4">
          <Palette className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-900 mb-1">No Brand DNA</p>
        <p className="text-xs text-zinc-500 mb-4">
          Extract your brand identity from a website to see it here.
        </p>
        <Link
          href="/"
          className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          Extract Brand DNA
        </Link>
      </div>
    );
  }

  const colors = [
    { label: 'Primary', hex: brand.colors.primary },
    { label: 'Secondary', hex: brand.colors.secondary },
    { label: 'Accent', hex: brand.colors.accent },
    { label: 'Background', hex: brand.colors.background },
    { label: 'Text', hex: brand.colors.text },
  ].filter((c) => c.hex);

  const palette = brand.colors.palette ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 truncate">{brand.brandName}</h3>
          {brand.websiteUrl && (
            <a
              href={`https://${brand.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        {brand.websiteUrl && (
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{brand.websiteUrl}</p>
        )}
      </div>

      {/* Colors */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-700">Colors</span>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-3">
          {colors.map((c) => (
            <button
              key={c.label}
              onClick={() => copyColor(c.hex!)}
              className="flex flex-col items-center gap-1 group"
              title={`${c.label}: ${c.hex}`}
            >
              <div
                className="w-8 h-8 rounded-lg shadow-sm border border-black/10 group-hover:scale-110 transition-transform relative"
                style={{ backgroundColor: c.hex }}
              >
                {copiedColor === c.hex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-400">{c.label}</span>
            </button>
          ))}
        </div>

        {palette.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {palette.slice(0, 8).map((hex, i) => (
              <button
                key={i}
                onClick={() => copyColor(hex)}
                className="w-5 h-5 rounded border border-black/10 hover:scale-125 transition-transform relative"
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {copiedColor === hex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Typography */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Type className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-700">Typography</span>
        </div>

        <div className="space-y-2">
          {brand.typography.heading && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">Heading</span>
              <span className="text-xs font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                {brand.typography.heading}
              </span>
            </div>
          )}
          {brand.typography.body && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">Body</span>
              <span className="text-xs font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                {brand.typography.body}
              </span>
            </div>
          )}
          {brand.typography.style && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">Style</span>
              <span className="text-[10px] text-zinc-600">{brand.typography.style}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tone */}
      {brand.tone.keywords && brand.tone.keywords.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700">Brand Tone</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {brand.tone.keywords.map((kw, i) => (
              <span
                key={i}
                className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full"
              >
                {kw}
              </span>
            ))}
          </div>
          {brand.tone.voiceDescription && (
            <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
              {brand.tone.voiceDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
