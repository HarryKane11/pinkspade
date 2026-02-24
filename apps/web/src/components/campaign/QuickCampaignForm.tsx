'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Building2,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllBrands, saveBrand } from '@/lib/brand-storage';
import type { StoredBrandDna } from '@/lib/brand-storage';
import {
  getCategories,
  getPresetsByCategory,
} from '@/lib/shared/channel-presets';
import { FAL_MODELS } from '@/lib/fal';
import type { CampaignFormat } from './CampaignWizard';

// ─── Mood options (mirrored from Step2Creative) ───

const MOOD_OPTIONS = [
  { id: 'minimal', label: '미니멀', labelEn: 'Minimalist' },
  { id: 'modern', label: '모던', labelEn: 'Modern' },
  { id: 'warm', label: '따뜻한', labelEn: 'Warm' },
  { id: 'bold', label: '대담한', labelEn: 'Bold' },
  { id: 'luxury', label: '럭셔리', labelEn: 'Premium' },
  { id: 'natural', label: '자연적', labelEn: 'Natural' },
  { id: 'retro', label: '레트로', labelEn: 'Retro' },
  { id: 'tech', label: '테크', labelEn: 'Modern' },
  { id: 'cute', label: '귀여운', labelEn: 'Playful' },
  { id: 'elegant', label: '우아한', labelEn: 'Elegant' },
];

// ─── Channel package definitions ───

const PACKAGE_OPTIONS = [
  {
    id: 'sns',
    label: 'SNS 패키지',
    description: 'Instagram + Facebook + Kakao',
  },
  {
    id: 'shopping',
    label: '쇼핑몰 패키지',
    description: 'Naver Shopping + Coupang + Smartstore',
  },
  { id: 'all', label: '전체 채널', description: '모든 채널 포맷' },
] as const;

type PackageId = (typeof PACKAGE_OPTIONS)[number]['id'];

// ─── Channel package builder ───

const SNS_IDS = new Set([
  'instagram_feed_1_1',
  'instagram_story',
  'kakao_channel_square',
  'facebook_post',
]);
const SHOPPING_IDS = new Set([
  'naver_shopping',
  'naver_smartstore',
  'coupang_product',
  'coupang_detail',
]);

function buildFormatsFromPackage(packageId: PackageId): CampaignFormat[] {
  const categories = getCategories();
  const allFormats: CampaignFormat[] = [];

  for (const cat of categories) {
    const presets = getPresetsByCategory(cat.id);
    for (const p of presets) {
      let checked = false;
      if (packageId === 'sns') checked = SNS_IDS.has(p.id);
      else if (packageId === 'shopping') checked = SHOPPING_IDS.has(p.id);
      else if (packageId === 'all') checked = true;

      allFormats.push({
        id: p.id,
        label: p.nameKo,
        channelId: cat.id,
        logo: cat.logo || '',
        width: p.width,
        height: p.height,
        checked,
      });
    }
  }
  return allFormats;
}

// ─── Loading step definitions ───

interface LoadingStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

// ─── Component ───

export function QuickCampaignForm() {
  const router = useRouter();

  // Input mode
  const [mode, setMode] = useState<'url' | 'brand'>('url');
  const [url, setUrl] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageId>('sns');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([
    'modern',
    'bold',
    'minimal',
  ]);
  const [selectedModel, setSelectedModel] = useState('flux-dev');

  // Brands list
  const [brands, setBrands] = useState<StoredBrandDna[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { label: '브랜드 분석 중...', status: 'pending' },
    { label: '카피 생성 중...', status: 'pending' },
    { label: '캠페인 준비 중...', status: 'pending' },
  ]);

  // Load brands on mount
  useEffect(() => {
    getAllBrands().then((list) => {
      setBrands(list);
      setBrandsLoaded(true);
    });
  }, []);

  // Toggle mood
  const toggleMood = useCallback((id: string) => {
    setSelectedMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  // Update loading step status
  const setStepStatus = useCallback(
    (index: number, status: LoadingStep['status']) => {
      setLoadingSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status } : s))
      );
    },
    []
  );

  // Validation
  const canSubmit =
    (mode === 'url' ? url.trim().length > 0 : selectedBrandId !== '') &&
    campaignDescription.trim().length > 0;

  // ─── Main generation handler ───

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;

    setIsGenerating(true);
    setError(null);
    setLoadingSteps([
      { label: '브랜드 분석 중...', status: 'active' },
      { label: '카피 생성 중...', status: 'pending' },
      { label: '캠페인 준비 중...', status: 'pending' },
    ]);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let brandDna: any;
      let brandId: string | null = null;

      if (mode === 'url') {
        // ── Step 1: Extract brand DNA from URL ──
        const res = await fetch('/api/brand-dna/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 401) {
            throw new Error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
          }
          throw new Error(
            body.error || '브랜드 분석에 실패했습니다. URL을 확인해주세요.'
          );
        }

        const result = await res.json();
        brandDna = result.brandDna;

        // Save brand
        const saved = await saveBrand({
          brandName: brandDna.brandName || brandDna.name || new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
          websiteUrl: url,
          extractedAt: new Date().toISOString(),
          colors: brandDna.colors ?? {},
          typography: brandDna.typography ?? {},
          tone: brandDna.tone ?? {},
        });
        brandId = saved?.id || null;
      } else {
        // ── Step 1: Use existing brand ──
        const found = brands.find((b) => b.id === selectedBrandId);
        if (!found) throw new Error('선택한 브랜드를 찾을 수 없습니다.');
        brandDna = found;
        brandId = found.id;
      }

      setStepStatus(0, 'done');
      setStepStatus(1, 'active');

      // ── Step 2: Auto-generate copy ──
      let headline = '';
      let description = '';

      try {
        const copyRes = await fetch('/api/copy/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textLayers: [
              { id: 'headline', name: 'Headline', content: '' },
              { id: 'description', name: 'Description', content: '' },
            ],
            brandDna: {
              brandName: brandDna.name || brandDna.brandName,
              tone: brandDna.tone,
            },
            moods: selectedMoods.map(
              (id) =>
                MOOD_OPTIONS.find((m) => m.id === id)?.labelEn || id
            ),
            prompt: campaignDescription,
            channelCategory: 'instagram',
          }),
        });

        if (copyRes.ok) {
          const copyResult = await copyRes.json();
          headline = copyResult.copies?.headline || '';
          description = copyResult.copies?.description || '';
        }
        // If copy generation fails, proceed with empty values (non-blocking)
      } catch {
        // Non-blocking: proceed with empty headline/description
      }

      setStepStatus(1, 'done');
      setStepStatus(2, 'active');

      // ── Step 3: Build campaign data and redirect ──
      const formats = buildFormatsFromPackage(selectedPackage);

      const campaignData = {
        formats,
        brandId,
        brandDna: {
          id: brandId,
          name: brandDna.name || brandDna.brandName,
          brandName: brandDna.name || brandDna.brandName,
          colors: brandDna.colors ?? {},
          typography: brandDna.typography ?? {},
          tone: brandDna.tone ?? {},
        },
        modelId: selectedModel,
        prompt: campaignDescription,
        moods: selectedMoods,
        productImage: null,
        productImageName: null,
        headline,
        description,
        forbiddenWords: [],
        requiredPhrases: [],
        variationCount: 3,
        concepts: [],
        selectedConceptId: null,
        editingAssetId: null,
        scopeMode: 'all',
        complianceResults: [],
      };

      // Store in sessionStorage for the wizard to pick up
      sessionStorage.setItem(
        'campaignDraft',
        JSON.stringify({
          step: 2, // Jump directly to Step 3 (Generate) - steps are 0-indexed
          data: campaignData,
        })
      );

      setStepStatus(2, 'done');

      // Short delay so user sees the final checkmark
      await new Promise((r) => setTimeout(r, 600));

      // Navigate to campaign wizard
      router.push('/campaign/new');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      setIsGenerating(false);
      setLoadingSteps([
        { label: '브랜드 분석 중...', status: 'pending' },
        { label: '카피 생성 중...', status: 'pending' },
        { label: '캠페인 준비 중...', status: 'pending' },
      ]);
    }
  }, [
    canSubmit,
    mode,
    url,
    brands,
    selectedBrandId,
    selectedMoods,
    campaignDescription,
    selectedPackage,
    selectedModel,
    setStepStatus,
    router,
  ]);

  // ─── Render ───

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50/30 to-white flex items-center justify-center px-4 py-12">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          // ── Loading State ──
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white border border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] rounded-2xl p-8 md:p-10">
              {/* Animated logo */}
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 shadow-md mx-auto relative">
                <div className="absolute inset-0 rounded-xl bg-pink-400/20 animate-ping" />
                <Zap className="w-5 h-5 text-white relative z-10" />
              </div>

              <h2 className="text-xl font-medium tracking-tight text-zinc-900 text-center mb-2">
                캠페인 생성 중
              </h2>
              <p className="text-sm text-zinc-500 text-center mb-8 font-light">
                AI가 에셋을 준비하고 있습니다
              </p>

              <div className="flex flex-col gap-5">
                {loadingSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'flex items-center gap-4 transition-all duration-300',
                      step.status === 'pending' && 'opacity-40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                        step.status === 'done'
                          ? 'bg-zinc-900 border border-zinc-900'
                          : 'bg-zinc-50 border border-zinc-200'
                      )}
                    >
                      {step.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors duration-300',
                        step.status === 'done'
                          ? 'text-zinc-900'
                          : step.status === 'active'
                            ? 'text-zinc-700'
                            : 'text-zinc-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // ── Form State ──
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-lg"
          >
            {/* Hero text */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 mb-5">
                <Zap className="w-3.5 h-3.5 text-pink-500" />
                <span className="text-xs font-medium text-pink-600">
                  Quick Mode
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 mb-3">
                1분 안에 캠페인 에셋 생성
              </h1>
              <p className="text-base text-zinc-500 font-light leading-relaxed">
                URL과 한 줄 설명만 입력하면, AI가 나머지를 채워드립니다.
              </p>
            </div>

            {/* Main card */}
            <div className="bg-white border border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] rounded-2xl p-6 md:p-8">
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl mb-6">
                <button
                  onClick={() => setMode('url')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === 'url'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  <Link2 className="w-4 h-4" />
                  새 URL
                </button>
                <button
                  onClick={() => setMode('brand')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === 'brand'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  기존 브랜드
                </button>
              </div>

              {/* URL input OR Brand selector */}
              {mode === 'url' ? (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    웹사이트 URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400 font-medium text-zinc-900"
                      autoComplete="off"
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    브랜드 선택
                  </label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all text-zinc-900 font-medium appearance-none"
                  >
                    <option value="">
                      {brandsLoaded
                        ? brands.length === 0
                          ? '저장된 브랜드가 없습니다'
                          : '브랜드를 선택하세요'
                        : '불러오는 중...'}
                    </option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brandName}
                        {b.websiteUrl ? ` (${b.websiteUrl})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campaign description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  캠페인 설명
                </label>
                <input
                  type="text"
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="예: 봄 신상품 런칭 캠페인"
                  className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400 font-medium text-zinc-900"
                  autoComplete="off"
                />
              </div>

              {/* Advanced settings (collapsible) */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden mb-6">
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <span>고급 설정</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-5 border-t border-zinc-100 pt-4">
                        {/* Channel packages */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            채널 패키지
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PACKAGE_OPTIONS.map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={cn(
                                  'px-3 py-2 rounded-lg text-sm border transition-all',
                                  selectedPackage === pkg.id
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                )}
                              >
                                <span className="font-medium">
                                  {pkg.label}
                                </span>
                                <span className="text-xs ml-1.5 opacity-70">
                                  {pkg.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mood selector */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            무드
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MOOD_OPTIONS.map((mood) => {
                              const selected = selectedMoods.includes(mood.id);
                              return (
                                <button
                                  key={mood.id}
                                  onClick={() => toggleMood(mood.id)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                                    selected
                                      ? 'bg-pink-50 text-pink-700 border-pink-200'
                                      : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                                  )}
                                >
                                  {mood.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* AI model dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            AI 모델
                          </label>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all text-zinc-900 font-medium appearance-none"
                          >
                            {FAL_MODELS.filter((m) => m.type === 'image').map(
                              (m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nameKo} ({m.name})
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl mb-5"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!canSubmit}
                className={cn(
                  'w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  canSubmit
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/25 active:scale-[0.98]'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                )}
              >
                <Zap className="w-4 h-4" />
                캠페인 생성하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
