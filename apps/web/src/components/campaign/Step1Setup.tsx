'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategories, getPresetsByCategory, type ChannelPreset } from '@/lib/shared/channel-presets';
import { FAL_MODELS, type FalModel } from '@/lib/fal';
import { BrandPresetCard } from './BrandPresetCard';
import { CreditEstimator } from './CreditEstimator';
import type { CampaignData, CampaignFormat } from './CampaignWizard';

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
  const [showBrandModal, setShowBrandModal] = useState(false);

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

  // Initialize formats from channel presets
  useEffect(() => {
    if (data.formats.length > 0) return;
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
          checked: false,
        });
      }
    }
    update('formats', allFormats);
  }, [categories, data.formats.length, update]);

  const toggleFormat = useCallback((id: string) => {
    update('formats', data.formats.map((f) => f.id === id ? { ...f, checked: !f.checked } : f));
  }, [data.formats, update]);

  const addCustomSize = useCallback(() => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (isNaN(w) || isNaN(h) || w < 100 || h < 100) return;
    const id = `custom-${w}x${h}-${Date.now()}`;
    update('formats', [...data.formats, {
      id,
      label: `커스텀 ${w}×${h}`,
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
    update('brandDna', brand as unknown as Record<string, unknown>);
    setShowBrandModal(false);
  }, [update]);

  // Group formats by channel
  const grouped = categories.map((cat) => ({
    category: cat,
    formats: data.formats.filter((f) => f.channelId === cat.id),
  })).filter((g) => g.formats.length > 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">캠페인 채널 & 브랜드 설정</h2>
        <p className="text-sm text-zinc-500 mb-6">에셋을 생성할 채널과 브랜드를 선택하세요.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Channel Selection (3/5) */}
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h3 className="text-sm font-semibold text-zinc-700">채널 선택</h3>

          {grouped.map(({ category, formats }) => (
            <div key={category.id} className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {category.nameKo}
              </p>
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => toggleFormat(fmt.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
                    fmt.checked
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                      fmt.checked
                        ? 'bg-pink-500 border-pink-500'
                        : 'border-zinc-300',
                    )}
                  >
                    {fmt.checked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {fmt.logo && (
                    <img src={fmt.logo} alt="" className="w-5 h-5 object-contain rounded-sm" />
                  )}
                  <span className={cn('text-sm font-medium', fmt.checked ? 'text-pink-600' : 'text-zinc-700')}>
                    {fmt.label}
                  </span>
                  <span className="text-xs text-zinc-400 ml-auto font-mono">
                    {fmt.width}×{fmt.height}
                  </span>
                </button>
              ))}
            </div>
          ))}

          {/* Custom size */}
          {!showCustomSize ? (
            <button
              onClick={() => setShowCustomSize(true)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              커스텀 사이즈 추가
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-20 px-2 py-1.5 border border-zinc-300 rounded-lg text-sm text-center"
                placeholder="너비"
                min={100}
              />
              <span className="text-zinc-400">×</span>
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
          {/* Brand preset */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700">브랜드 프리셋</h3>
            <BrandPresetCard
              brandDna={data.brandDna as any}
              onChangeBrand={() => setShowBrandModal(true)}
              onSkip={() => { update('brandId', null); update('brandDna', null); }}
            />
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

      {/* Brand selector modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">브랜드 선택</h3>
              <button onClick={() => setShowBrandModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {brands.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">등록된 브랜드가 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBrand(b)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-left"
                  >
                    <div className="flex gap-1">
                      {[b.colors?.primary, b.colors?.secondary, b.colors?.accent].filter(Boolean).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-zinc-200" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-zinc-900">{b.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
