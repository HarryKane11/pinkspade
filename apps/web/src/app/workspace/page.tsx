'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette,
  Trash2,
  Plus,
  ExternalLink,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';
import { getAllBrands, removeBrand, type StoredBrandDna } from '@/lib/brand-storage';
import {
  getDesignsGroupedByBrandAndChannel,
  removeDesignFromHistory,
  type DesignHistoryEntry,
} from '@/lib/design-history';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function WorkspacePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<StoredBrandDna[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [designGroups, setDesignGroups] = useState<Record<string, Record<string, DesignHistoryEntry[]>>>({});
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const [b, d] = await Promise.all([
      getAllBrands(),
      getDesignsGroupedByBrandAndChannel(),
    ]);
    setBrands(b);
    setDesignGroups(d);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-expand all brand groups on first load
  useEffect(() => {
    const keys = Object.keys(designGroups);
    if (keys.length > 0 && expandedBrands.size === 0) {
      setExpandedBrands(new Set(keys));
    }
  }, [designGroups, expandedBrands.size]);

  const toggleBrand = useCallback((key: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleChannel = useCallback((key: string) => {
    setExpandedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleBrandClick = useCallback(
    (brand: StoredBrandDna) => {
      sessionStorage.setItem(
        'brandDna',
        JSON.stringify({
          brandName: brand.brandName,
          colors: brand.colors,
          typography: brand.typography,
          tone: brand.tone,
        })
      );
      sessionStorage.setItem('brandDnaUrl', brand.websiteUrl);
      sessionStorage.setItem('activeBrandId', brand.id);
      router.push('/brand-dna/extracted');
    },
    [router]
  );

  const handleRemoveBrand = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await removeBrand(id);
      refreshData();
    },
    [refreshData]
  );

  const handleRemoveDesign = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await removeDesignFromHistory(id);
      refreshData();
    },
    [refreshData]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setTimeout(refreshData, 600);
  }, [refreshData]);

  const totalDesigns = Object.values(designGroups).reduce(
    (sum, channels) => sum + Object.values(channels).reduce((s, entries) => s + entries.length, 0),
    0
  );

  // Build a brandId → brand lookup
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  const CHANNEL_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    naver: 'Naver',
    kakao: 'Kakao',
    coupang: 'Coupang',
    facebook: 'Facebook',
    uncategorized: 'Other',
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onStartSetup={() => setModalOpen(true)} />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Workspace</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage your saved Brand DNAs and projects.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Brand
          </button>
        </div>

        {/* Saved Brand DNAs */}
        <section>
          <h2 className="text-sm font-medium text-zinc-700 mb-4">Saved Brand DNAs</h2>

          {brands.length === 0 ? (
            <div className="border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900 mb-1">No brands yet</p>
              <p className="text-xs text-zinc-500 mb-4">
                Extract your first brand identity from a website.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                Extract Brand DNA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => {
                const colors = [
                  brand.colors.primary,
                  brand.colors.secondary,
                  brand.colors.accent,
                  brand.colors.background,
                ].filter(Boolean);

                return (
                  <div
                    key={brand.id}
                    onClick={() => handleBrandClick(brand)}
                    className="group border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Color strip */}
                    <div className="h-2 flex">
                      {colors.length > 0 ? (
                        colors.map((hex, i) => (
                          <div
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: hex }}
                          />
                        ))
                      ) : (
                        <div className="flex-1 bg-zinc-200" />
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-zinc-900 truncate">
                            {brand.brandName}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                            <span className="text-[10px] text-zinc-400 truncate">
                              {brand.websiteUrl}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveBrand(e, brand.id)}
                          className="p-1.5 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Color swatches */}
                      <div className="flex gap-1 mb-2">
                        {colors.slice(0, 5).map((hex, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>

                      {/* Typography */}
                      {brand.typography.heading && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                            {brand.typography.heading}
                          </span>
                          {brand.typography.body && brand.typography.body !== brand.typography.heading && (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                              {brand.typography.body}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-[10px] text-zinc-400">
                        {new Date(brand.extractedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Design History */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-700">
              Design History
              {totalDesigns > 0 && (
                <span className="ml-2 text-zinc-400 font-normal">({totalDesigns})</span>
              )}
            </h2>
          </div>

          {totalDesigns === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900 mb-1">No designs yet</p>
              <p className="text-xs text-zinc-400">
                Generated assets will automatically appear here, grouped by brand and channel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(designGroups).map(([brandKey, channels]) => {
                const brand = brandKey !== 'no-brand' ? brandMap.get(brandKey) : null;
                const brandName = brand?.brandName ?? 'Unbranded Designs';
                const brandColors = brand
                  ? [brand.colors.primary, brand.colors.secondary, brand.colors.accent].filter(Boolean)
                  : [];
                const isBrandExpanded = expandedBrands.has(brandKey);
                const totalInBrand = Object.values(channels).reduce((s, e) => s + e.length, 0);

                return (
                  <div key={brandKey} className="border border-zinc-200 rounded-xl overflow-hidden">
                    {/* Brand folder header */}
                    <button
                      onClick={() => toggleBrand(brandKey)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {brandColors.length > 0 ? (
                          brandColors.map((hex, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                          ))
                        ) : (
                          <FolderOpen className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-zinc-900">{brandName}</span>
                        <span className="ml-2 text-[11px] text-zinc-400">
                          {totalInBrand} asset{totalInBrand !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {isBrandExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Channel sub-folders */}
                    {isBrandExpanded && (
                      <div className="border-t border-zinc-100">
                        {Object.entries(channels).map(([channelKey, entries]) => {
                          const channelLabel = CHANNEL_LABELS[channelKey] || channelKey;
                          const channelExpandKey = `${brandKey}:${channelKey}`;
                          const isChannelExpanded = expandedChannels.has(channelExpandKey);

                          return (
                            <div key={channelKey}>
                              {/* Channel header */}
                              <button
                                onClick={() => toggleChannel(channelExpandKey)}
                                className="w-full flex items-center gap-2.5 pl-10 pr-4 py-2 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-zinc-700 flex-1">{channelLabel}</span>
                                <span className="text-[10px] text-zinc-400">{entries.length}</span>
                                {isChannelExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-300" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                                )}
                              </button>

                              {/* Design entries */}
                              {isChannelExpanded && (
                                <div className="pl-10 pr-4 pb-3 pt-2">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {entries.map((entry) => {
                                      const { time } = formatDateTime(entry.createdAt);
                                      return (
                                        <div
                                          key={entry.id}
                                          className="group/card relative rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer"
                                          onClick={() => setPreviewImage(entry.thumbnail)}
                                        >
                                          <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                                            <img src={entry.thumbnail} alt={entry.label} className="w-full h-full object-cover" />
                                            <button
                                              onClick={(e) => handleRemoveDesign(e, entry.id)}
                                              className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white opacity-0 group-hover/card:opacity-100 hover:bg-black/60 transition-all"
                                              title="Remove from history"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div className="px-2 py-1.5">
                                            <p className="text-[10px] font-medium text-zinc-700 truncate">{entry.label}</p>
                                            <div className="flex items-center justify-between mt-0.5">
                                              <span className="text-[9px] text-zinc-400">{entry.format}</span>
                                              <span className="text-[9px] text-zinc-400">{time}</span>
                                            </div>
                                            {entry.moods.length > 0 && (
                                              <div className="flex gap-0.5 mt-1 flex-wrap">
                                                {entry.moods.slice(0, 2).map((mood) => (
                                                  <span key={mood} className="text-[8px] bg-zinc-100 text-zinc-500 px-1 py-0.5 rounded">{mood}</span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Image preview overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-white rounded-full shadow-lg text-zinc-600 hover:text-zinc-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Design preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <BrandDNAModal open={modalOpen} onClose={handleModalClose} />
    </div>
  );
}
