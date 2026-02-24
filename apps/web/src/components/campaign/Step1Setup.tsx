'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, Palette, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategories, getPresetsByCategory } from '@/lib/shared/channel-presets';
import { FAL_MODELS } from '@/lib/fal';
import { CreditEstimator } from './CreditEstimator';
import { BrandDNAModal } from '@/components/brand/BrandDNAModal';
import type { CampaignData, CampaignFormat, CampaignBrandDna } from './CampaignWizard';

interface Step1SetupProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onNext: () => void;
}

export function Step1Setup({ data, update, onNext }: Step1SetupProps) {
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1080');
  const [brands, setBrands] = useState<Array<{ id: string; name: string; colors: Record<string, string>; typography: Record<string, string>; tone?: Record<string, unknown> }>>([]);
  const [showBrandDnaModal, setShowBrandDnaModal] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const categories = getCategories();
  const selectedCount = data.formats.filter((f) => f.checked).length;
  const imageModels = FAL_MODELS.filter((m) => m.type === 'image');

  // Load brands
  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.ok ? r.json() : { brands: [] })
      .then((d) => setBrands(d.brands || []))
      .catch(() => {});
  }, []);

  // Load brand DNA from session if available
  useEffect(() => {
    if (data.brandDna) return;
    try {
      const session = sessionStorage.getItem('brandDna');
      if (session) {
        const dna = JSON.parse(session);
        update('brandDna', dna);
        const id = sessionStorage.getItem('activeBrandId');
        if (id) update('brandId', id);
      }
    } catch { /* ignore */ }
  }, [data.brandDna, update]);

  // Check if channel presets are loaded (not just custom formats)
  const hasChannelPresets = data.formats.some((f) => f.channelId !== 'custom');

  // Rebuild channel presets whenever they're missing (handles session recovery race condition)
  useEffect(() => {
    if (hasChannelPresets) return;

    const checkedIds = new Set(data.formats.filter((f) => f.checked).map((f) => f.id));
    const customFormats = data.formats.filter((f) => f.channelId === 'custom');

    const allFormats: CampaignFormat[] = [];
    for (const cat of categories) {
      const presets = getPresetsByCategory(cat.id);
      for (const p of presets) {
        allFormats.push({
          id: p.id,
          label: p.nameKo,
          channelId: cat.id,
          logo: cat.logo || '',
          width: p.width,
          height: p.height,
          checked: checkedIds.has(p.id),
        });
      }
    }
    for (const cf of customFormats) {
      allFormats.push(cf);
    }
    update('formats', allFormats);

    // Open categories that have checked formats, or first 3 by default
    const catsWithChecked = new Set(
      allFormats.filter((f) => f.checked).map((f) => f.channelId),
    );
    if (catsWithChecked.size > 0) {
      setOpenCategories(catsWithChecked);
    } else {
      setOpenCategories(new Set(categories.slice(0, 3).map((c) => c.id)));
    }
  }, [hasChannelPresets, categories, data.formats, update]);

  const toggleFormat = useCallback((id: string) => {
    update('formats', data.formats.map((f) => f.id === id ? { ...f, checked: !f.checked } : f));
  }, [data.formats, update]);

  const toggleCategoryAll = useCallback((categoryId: string) => {
    const catFormats = data.formats.filter((f) => f.channelId === categoryId);
    const allChecked = catFormats.every((f) => f.checked);
    update('formats', data.formats.map((f) =>
      f.channelId === categoryId ? { ...f, checked: !allChecked } : f,
    ));
  }, [data.formats, update]);

  const toggleCategory = useCallback((categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const addCustomSize = useCallback(() => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (isNaN(w) || isNaN(h) || w < 100 || h < 100) return;
    const id = `custom-${w}x${h}-${Date.now()}`;
    update('formats', [...data.formats, {
      id,
      label: `${w}x${h}`,
      channelId: 'custom',
      logo: '',
      width: w,
      height: h,
      checked: true,
    }]);
    setShowCustomSize(false);
    setCustomWidth('1080');
    setCustomHeight('1080');
  }, [customWidth, customHeight, data.formats, update]);

  const selectBrand = useCallback((brand: typeof brands[0]) => {
    update('brandId', brand.id);
    update('brandDna', brand as CampaignBrandDna);
  }, [update]);

  const clearBrand = useCallback(() => {
    update('brandId', null);
    update('brandDna', null);
  }, [update]);

  // Group formats by channel (exclude 'custom' category from main list)
  const grouped = useMemo(() => categories
    .filter((cat) => cat.id !== 'custom')
    .map((cat) => ({
      category: cat,
      formats: data.formats.filter((f) => f.channelId === cat.id),
    }))
    .filter((g) => g.formats.length > 0), [categories, data.formats]);

  const customFormats = data.formats.filter((f) => f.channelId === 'custom');

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">채널 & 브랜드 설정</h2>
        <p className="text-sm text-zinc-500 mb-6">에셋을 생성할 채널과 브랜드를 선택하세요.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Channel Selection (3/5) */}
        <motion.div
          className="lg:col-span-3 space-y-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">채널 선택</h3>

          <div className="space-y-1">
            {grouped.map(({ category, formats }) => {
              const checkedCount = formats.filter((f) => f.checked).length;
              const allChecked = formats.length > 0 && checkedCount === formats.length;
              const isOpen = openCategories.has(category.id);

              return (
                <div key={category.id} className="border border-zinc-200 rounded-xl overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      checkedCount > 0 ? 'bg-pink-50/50' : 'bg-zinc-50/50 hover:bg-zinc-50',
                    )}
                  >
                    {category.logo && (
                      <img src={category.logo} alt="" className="w-5 h-5 object-contain rounded-sm flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-zinc-900">{category.nameKo}</span>
                    {checkedCount > 0 && (
                      <span className="text-[10px] font-semibold bg-pink-500 text-white px-1.5 py-0.5 rounded-full">
                        {checkedCount}/{formats.length}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {/* Select all checkbox */}
                      <div
                        role="checkbox"
                        aria-checked={allChecked}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryAll(category.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleCategoryAll(category.id); } }}
                        tabIndex={0}
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer',
                          allChecked
                            ? 'bg-pink-500 border-pink-500'
                            : checkedCount > 0
                              ? 'border-pink-300 bg-pink-100'
                              : 'border-zinc-300',
                        )}
                      >
                        {allChecked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {!allChecked && checkedCount > 0 && (
                          <div className="w-1.5 h-1.5 bg-pink-500 rounded-sm" />
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-zinc-400 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </div>
                  </button>

                  {/* Format list */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-2 pb-2 space-y-0.5">
                          {formats.map((fmt) => (
                            <button
                              key={fmt.id}
                              onClick={() => toggleFormat(fmt.id)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                                fmt.checked
                                  ? 'bg-pink-50 text-pink-700'
                                  : 'hover:bg-zinc-50 text-zinc-700',
                              )}
                            >
                              <div
                                className={cn(
                                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                                  fmt.checked
                                    ? 'bg-pink-500 border-pink-500'
                                    : 'border-zinc-300',
                                )}
                              >
                                {fmt.checked && (
                                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm flex-1 text-left">{fmt.label}</span>
                              <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                                {fmt.width}x{fmt.height}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Custom formats */}
          {customFormats.length > 0 && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50/50">
                <span className="text-sm font-medium text-zinc-900">커스텀</span>
              </div>
              <div className="px-2 pb-2 space-y-0.5">
                {customFormats.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => toggleFormat(fmt.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                      fmt.checked
                        ? 'bg-pink-50 text-pink-700'
                        : 'hover:bg-zinc-50 text-zinc-700',
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                        fmt.checked ? 'bg-pink-500 border-pink-500' : 'border-zinc-300',
                      )}
                    >
                      {fmt.checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm flex-1 text-left">{fmt.label}</span>
                    <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                      {fmt.width}x{fmt.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom size */}
          {!showCustomSize ? (
            <button
              onClick={() => setShowCustomSize(true)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              커스텀 사이즈 추가
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-1">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-20 px-2 py-1.5 border border-zinc-300 rounded-lg text-sm text-center"
                placeholder="너비"
                min={100}
              />
              <span className="text-zinc-400">x</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="w-20 px-2 py-1.5 border border-zinc-300 rounded-lg text-sm text-center"
                placeholder="높이"
                min={100}
              />
              <button
                onClick={addCustomSize}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
                추가
              </button>
              <button
                onClick={() => setShowCustomSize(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Right: Brand + Model (2/5) */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* Brand preset — inline list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700">브랜드 프리셋</h3>
            <div className="space-y-1.5">
              {brands.length === 0 ? (
                <div className="border border-dashed border-zinc-300 rounded-xl p-5 text-center">
                  <p className="text-sm text-zinc-500 mb-3">등록된 브랜드가 없습니다.</p>
                  <button
                    onClick={() => setShowBrandDnaModal(true)}
                    className="px-4 py-2 text-xs font-medium bg-pink-500 text-white rounded-lg hover:bg-pink-400 transition-colors"
                  >
                    새 브랜드 추출
                  </button>
                </div>
              ) : (
                <>
                  {brands.map((b) => {
                    const isSelected = data.brandId === b.id;
                    const colorSwatches = [b.colors?.primary, b.colors?.secondary, b.colors?.accent].filter(Boolean);
                    const font = b.typography?.heading || b.typography?.headingFont || '';
                    return (
                      <button
                        key={b.id}
                        onClick={() => isSelected ? clearBrand() : selectBrand(b)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                          isSelected
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
                        )}
                      >
                        {/* Color swatches */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {colorSwatches.length > 0 ? (
                            colorSwatches.map((c, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-zinc-200"
                                style={{ backgroundColor: c }}
                              />
                            ))
                          ) : (
                            <Palette className="w-4 h-4 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn('text-sm font-medium block truncate', isSelected ? 'text-pink-700' : 'text-zinc-900')}>
                            {b.name}
                          </span>
                          {font && (
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Type className="w-3 h-3" />
                              {font}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setShowBrandDnaModal(true)}
                      className="text-xs font-medium text-pink-500 hover:text-pink-600 transition-colors"
                    >
                      + 새 브랜드 추출
                    </button>
                    {data.brandDna && (
                      <button
                        onClick={clearBrand}
                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        건너뛰기
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Model */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700">AI 모델</h3>
            <select
              value={data.modelId}
              onChange={(e) => update('modelId', e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white"
            >
              {imageModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameKo || m.name} · {m.quality} · {m.creditTier}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="mt-8 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <CreditEstimator
          modelId={data.modelId}
          formatCount={selectedCount}
          variationCount={data.variationCount}
        />

        <div className="flex items-center justify-end">
          <button
            onClick={onNext}
            disabled={selectedCount === 0}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
              selectedCount > 0
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed',
            )}
          >
            다음: 크리에이티브 입력 →
          </button>
        </div>
      </motion.div>

      {/* Brand DNA extraction modal */}
      <BrandDNAModal
        open={showBrandDnaModal}
        onClose={() => {
          setShowBrandDnaModal(false);
          // Reload brands and select the latest one
          fetch('/api/brands')
            .then((r) => r.ok ? r.json() : { brands: [] })
            .then((d) => {
              setBrands(d.brands || []);
              if (d.brands?.[0]) {
                selectBrand(d.brands[0]);
              }
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}
