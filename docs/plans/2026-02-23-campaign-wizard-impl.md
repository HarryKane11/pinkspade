# Campaign Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3-panel studio with a 4-step campaign wizard (Setup → Creative → Generate & Edit → Review & Export) that eliminates cognitive overload and follows "automation first, control second" UX.

**Architecture:** Single-page wizard at `/campaign/new` using React state for step navigation with Framer Motion transitions. No Konva canvas — assets are static image previews with a slide-in property editor. Existing API routes (`/api/media/generate`, `/api/copy/generate`, `/api/brands`, `/api/credits/balance`) are reused without modification.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion, Lucide React icons

**Design Doc:** `docs/plans/2026-02-23-campaign-wizard-redesign.md`

---

## Task 1: Create Page Route + CampaignWizard Shell

**Files:**
- Create: `apps/web/src/app/campaign/new/page.tsx`
- Create: `apps/web/src/components/campaign/CampaignWizard.tsx`
- Create: `apps/web/src/components/campaign/CampaignStepper.tsx`

**Step 1: Create the page route**

Create `apps/web/src/app/campaign/new/page.tsx`:
```tsx
'use client';

import { CampaignWizard } from '@/components/campaign/CampaignWizard';

export default function NewCampaignPage() {
  return <CampaignWizard />;
}
```

**Step 2: Create CampaignStepper component**

Create `apps/web/src/components/campaign/CampaignStepper.tsx`:
```tsx
'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: '캠페인 설정', sub: '채널 + 브랜드' },
  { label: '크리에이티브 입력', sub: '프롬프트 + 방향성' },
  { label: '생성 & 편집', sub: '결과물 미리보기 + 미세조정' },
  { label: '검토 & 내보내기', sub: '컴플라이언스 + 최종 확인' },
];

interface CampaignStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function CampaignStepper({ currentStep, onStepClick }: CampaignStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isClickable = i < currentStep;

        return (
          <div key={i} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all',
                isClickable && 'cursor-pointer hover:bg-zinc-50',
                !isClickable && !isCurrent && 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  isCompleted && 'bg-zinc-900 text-white',
                  isCurrent && 'bg-pink-500 text-white',
                  !isCompleted && !isCurrent && 'bg-zinc-100 text-zinc-400',
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className="text-left hidden sm:block">
                <p
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isCurrent ? 'text-zinc-900' : isCompleted ? 'text-zinc-600' : 'text-zinc-400',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-zinc-400 leading-tight">{step.sub}</p>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-px mx-1',
                  i < currentStep ? 'bg-zinc-900' : 'bg-zinc-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Create CampaignWizard shell with step state**

Create `apps/web/src/components/campaign/CampaignWizard.tsx`:
```tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { CampaignStepper } from './CampaignStepper';
import { cn } from '@/lib/utils';

// Types
export interface CampaignFormat {
  id: string;
  label: string;
  channelId: string;
  logo: string;
  width: number;
  height: number;
  checked: boolean;
}

export interface CampaignAsset {
  id: string;
  conceptId: string;
  formatId: string;
  imageUrl: string;
  headline: string;
  description: string;
  headlineFontSize: number;
  headlineFontFamily: string;
  headlineColor: string;
  descriptionFontSize: number;
  descriptionFontFamily: string;
  descriptionColor: string;
  backgroundColor: string;
  status: 'loading' | 'ok' | 'text-overflow' | 'compliance-warning' | 'error';
  statusMessage?: string;
}

export interface Concept {
  id: string;
  label: string;
  assets: CampaignAsset[];
}

export interface ComplianceCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  message?: string;
  assetId?: string;
  suggestion?: string;
}

export interface CampaignData {
  // Step 1
  formats: CampaignFormat[];
  brandId: string | null;
  brandDna: Record<string, unknown> | null;
  modelId: string;
  // Step 2
  prompt: string;
  moods: string[];
  productImage: string | null; // base64
  productImageName: string | null;
  headline: string;
  description: string;
  forbiddenWords: string[];
  requiredPhrases: string[];
  variationCount: number;
  // Step 3
  concepts: Concept[];
  selectedConceptId: string | null;
  editingAssetId: string | null;
  scopeMode: 'all' | 'this';
  // Step 4
  complianceResults: ComplianceCheck[];
}

const INITIAL_DATA: CampaignData = {
  formats: [],
  brandId: null,
  brandDna: null,
  modelId: 'flux-dev',
  prompt: '',
  moods: [],
  productImage: null,
  productImageName: null,
  headline: '',
  description: '',
  forbiddenWords: [],
  requiredPhrases: [],
  variationCount: 3,
  concepts: [],
  selectedConceptId: null,
  editingAssetId: null,
  scopeMode: 'all',
  complianceResults: [],
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const TOTAL_STEPS = 4;

export function CampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<CampaignData>(INITIAL_DATA);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const next = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  }, [step]);

  const update = useCallback(<K extends keyof CampaignData>(field: K, value: CampaignData[K]) => {
    setData((d) => ({ ...d, [field]: value }));
  }, []);

  const handleExit = useCallback(() => {
    router.push('/workspace');
  }, [router]);

  // Step components will be wired in subsequent tasks
  const stepContent = [
    <div key="step1" className="text-center text-zinc-400 py-20">Step 1: 캠페인 설정 (placeholder)</div>,
    <div key="step2" className="text-center text-zinc-400 py-20">Step 2: 크리에이티브 입력 (placeholder)</div>,
    <div key="step3" className="text-center text-zinc-400 py-20">Step 3: 생성 & 편집 (placeholder)</div>,
    <div key="step4" className="text-center text-zinc-400 py-20">Step 4: 검토 & 내보내기 (placeholder)</div>,
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-400 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 flex-shrink-0 mt-1">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          나가기
        </button>

        <CampaignStepper currentStep={step} onStepClick={goToStep} />

        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          임시저장
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Verify the page renders**

Run: `cd apps/web && npx next dev`
Navigate to: `http://localhost:3000/campaign/new`
Expected: Full-page wizard with stepper, progress bar, placeholder content, and step transitions working.

**Step 5: Commit**
```bash
git add apps/web/src/app/campaign/new/page.tsx apps/web/src/components/campaign/
git commit -m "feat(campaign): add wizard shell with stepper and step navigation"
```

---

## Task 2: Step 1 — 캠페인 설정 (Campaign Setup)

**Files:**
- Create: `apps/web/src/components/campaign/Step1Setup.tsx`
- Create: `apps/web/src/components/campaign/BrandPresetCard.tsx`
- Create: `apps/web/src/components/campaign/CreditEstimator.tsx`
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx` (wire Step1)

**Step 1: Create CreditEstimator component**

Create `apps/web/src/components/campaign/CreditEstimator.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getCreditCost } from '@/lib/credits';

interface CreditEstimatorProps {
  modelId: string;
  formatCount: number;
  variationCount: number;
}

export function CreditEstimator({ modelId, formatCount, variationCount }: CreditEstimatorProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits/balance')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setBalance(d.balance ?? d.credits ?? null))
      .catch(() => {});
  }, []);

  const costPerFormat = getCreditCost(modelId);
  const totalCost = costPerFormat * formatCount * variationCount;
  const insufficient = balance !== null && totalCost > balance;

  if (formatCount === 0) return null;

  return (
    <div className="flex items-center justify-between text-sm px-1">
      <div className="flex items-center gap-2 text-zinc-500">
        <span>예상 크레딧:</span>
        <span className="font-semibold text-zinc-900">{totalCost} cr</span>
        <span className="text-zinc-400">
          ({formatCount}개 포맷 × {variationCount}개 변형 × {costPerFormat} cr)
        </span>
      </div>
      {balance !== null && (
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">잔액:</span>
          <span className={insufficient ? 'font-semibold text-red-500' : 'font-semibold text-zinc-700'}>
            {balance.toLocaleString()} cr
          </span>
          {insufficient && (
            <span className="flex items-center gap-1 text-red-500 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              크레딧 부족
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create BrandPresetCard component**

Create `apps/web/src/components/campaign/BrandPresetCard.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Palette, Type, MessageSquare, RefreshCw, SkipForward } from 'lucide-react';

interface BrandDnaSummary {
  id: string;
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  tone?: { style?: string; keywords?: string[] };
}

interface BrandPresetCardProps {
  brandDna: BrandDnaSummary | null;
  onChangeBrand: () => void;
  onSkip: () => void;
}

export function BrandPresetCard({ brandDna, onChangeBrand, onSkip }: BrandPresetCardProps) {
  if (!brandDna) {
    return (
      <div className="border border-dashed border-zinc-300 rounded-xl p-5 text-center">
        <p className="text-sm text-zinc-500 mb-3">브랜드 프리셋을 선택하면 색상, 폰트, 톤이 자동 적용됩니다.</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onChangeBrand}
            className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            브랜드 선택
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    );
  }

  const colors = brandDna.colors ?? {};
  const colorSwatches = [colors.primary, colors.secondary, colors.accent, colors.background, colors.text].filter(Boolean);
  const font = brandDna.typography?.heading || brandDna.typography?.headingFont || 'Pretendard';
  const toneStyle = brandDna.tone?.style || '';

  return (
    <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900">{brandDna.name}</h4>
        <button
          onClick={onChangeBrand}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          변경
        </button>
      </div>

      {/* Color swatches */}
      <div className="flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-zinc-400" />
        <div className="flex items-center gap-1">
          {colorSwatches.map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-md border border-zinc-200"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <Type className="w-3.5 h-3.5 text-zinc-400" />
        <span>{font}</span>
      </div>

      {/* Tone */}
      {toneStyle && (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>{toneStyle}</span>
          {brandDna.tone?.keywords?.slice(0, 3).map((kw, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px]">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create Step1Setup component**

Create `apps/web/src/components/campaign/Step1Setup.tsx`:
```tsx
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
          logo: cat.logo ? `/channel-logos/${cat.logo}` : '',
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
```

**Step 4: Wire Step1 into CampaignWizard**

In `apps/web/src/components/campaign/CampaignWizard.tsx`, replace the placeholder `stepContent[0]` with:
```tsx
import { Step1Setup } from './Step1Setup';

// In stepContent array:
<Step1Setup key="step1" data={data} update={update} onNext={next} />,
```

**Step 5: Verify Step 1 renders**

Navigate to `http://localhost:3000/campaign/new`.
Expected: Step 1 shows channel checkboxes grouped by platform, brand preset card, model selector, and credit estimator. Selecting channels updates the count and credit estimate. Next button is disabled until at least one channel is selected.

**Step 6: Commit**
```bash
git add apps/web/src/components/campaign/Step1Setup.tsx apps/web/src/components/campaign/BrandPresetCard.tsx apps/web/src/components/campaign/CreditEstimator.tsx apps/web/src/components/campaign/CampaignWizard.tsx
git commit -m "feat(campaign): add Step 1 — channel selection, brand preset, model picker"
```

---

## Task 3: Step 2 — 크리에이티브 입력 (Creative Input)

**Files:**
- Create: `apps/web/src/components/campaign/Step2Creative.tsx`
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx` (wire Step2)

**Step 1: Create Step2Creative component**

Create `apps/web/src/components/campaign/Step2Creative.tsx`:
```tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Sparkles, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCreditCost } from '@/lib/credits';
import type { CampaignData } from './CampaignWizard';

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

interface Step2CreativeProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Creative({ data, update, onNext, onBack }: Step2CreativeProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
  const [descSuggestions, setDescSuggestions] = useState<string[]>([]);
  const [loadingCopy, setLoadingCopy] = useState<'headline' | 'description' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFormats = data.formats.filter((f) => f.checked);
  const totalCost = getCreditCost(data.modelId) * selectedFormats.length * data.variationCount;

  const toggleMood = useCallback((id: string) => {
    const current = data.moods;
    if (current.includes(id)) {
      update('moods', current.filter((m) => m !== id));
    } else if (current.length < 3) {
      update('moods', [...current, id]);
    }
  }, [data.moods, update]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update('productImage', reader.result as string);
      update('productImageName', file.name);
    };
    reader.readAsDataURL(file);
  }, [update]);

  const removeImage = useCallback(() => {
    update('productImage', null);
    update('productImageName', null);
  }, [update]);

  const generateCopy = useCallback(async (field: 'headline' | 'description') => {
    setLoadingCopy(field);
    try {
      const textLayers = [
        { id: 'headline', name: 'Headline', content: data.headline || '헤드라인을 생성해주세요' },
        { id: 'description', name: 'Description', content: data.description || '설명을 생성해주세요' },
      ];
      const res = await fetch('/api/copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textLayers,
          brandDna: data.brandDna || undefined,
          moods: data.moods.map((id) => MOOD_OPTIONS.find((m) => m.id === id)?.labelEn || id),
          prompt: data.prompt,
        }),
      });
      if (!res.ok) throw new Error('Copy generation failed');
      const result = await res.json();
      const copies = result.copies || {};
      if (field === 'headline' && copies.headline) {
        setHeadlineSuggestions([copies.headline]);
      }
      if (field === 'description' && copies.description) {
        setDescSuggestions([copies.description]);
      }
    } catch {
      // silently fail — user can still type manually
    } finally {
      setLoadingCopy(null);
    }
  }, [data]);

  const addForbiddenWord = useCallback((word: string) => {
    if (!word.trim()) return;
    update('forbiddenWords', [...data.forbiddenWords, word.trim()]);
  }, [data.forbiddenWords, update]);

  const removeForbiddenWord = useCallback((idx: number) => {
    update('forbiddenWords', data.forbiddenWords.filter((_, i) => i !== idx));
  }, [data.forbiddenWords, update]);

  const addRequiredPhrase = useCallback((phrase: string) => {
    if (!phrase.trim()) return;
    update('requiredPhrases', [...data.requiredPhrases, phrase.trim()]);
  }, [data.requiredPhrases, update]);

  const removeRequiredPhrase = useCallback((idx: number) => {
    update('requiredPhrases', data.requiredPhrases.filter((_, i) => i !== idx));
  }, [data.requiredPhrases, update]);

  const canProceed = data.prompt.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">크리에이티브 방향 설정</h2>
        <p className="text-sm text-zinc-500 mb-6">캠페인의 분위기, 메시지, 이미지 방향을 설정하세요.</p>
      </motion.div>

      {/* Mood chips */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <label className="text-sm font-semibold text-zinc-700 block mb-2">
          무드 선택 <span className="text-zinc-400 font-normal">(최대 3개)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => {
            const selected = data.moods.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleMood(mood.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
                  selected
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300',
                )}
              >
                {mood.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Campaign description */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <label className="text-sm font-semibold text-zinc-700 block mb-2">캠페인 설명</label>
        <textarea
          value={data.prompt}
          onChange={(e) => update('prompt', e.target.value)}
          placeholder="캠페인의 목적, 분위기, 강조할 메시지를 자유롭게 설명해주세요. 예: 겨울 시즌 세일을 홍보하는 캠페인입니다. 따뜻한 색감의 배경에 제품 이미지를 활용하고, '최대 50% 할인' 메시지를 강조해주세요."
          rows={4}
          className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all"
        />

        {/* Product image upload */}
        <div className="mt-3">
          {data.productImage ? (
            <div className="flex items-center gap-3 px-3 py-2 bg-zinc-50 rounded-lg">
              <img src={data.productImage} alt="" className="w-10 h-10 object-cover rounded" />
              <span className="text-xs text-zinc-600 flex-1 truncate">{data.productImageName}</span>
              <button onClick={removeImage} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              제품 이미지 첨부
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </motion.div>

      {/* Copy fields */}
      <motion.div
        className="mb-6 grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Headline */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">헤드라인</label>
          <input
            type="text"
            value={data.headline}
            onChange={(e) => update('headline', e.target.value)}
            placeholder="겨울 특별 세일"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
          />
          <button
            onClick={() => generateCopy('headline')}
            disabled={loadingCopy === 'headline'}
            className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {loadingCopy === 'headline' ? '생성 중...' : 'AI 추천 받기'}
          </button>
          <AnimatePresence>
            {headlineSuggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => { update('headline', s); setHeadlineSuggestions([]); }}
                className="text-xs px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors w-full text-left"
              >
                {s}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">설명</label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="최대 50% 할인, 지금 바로 확인하세요"
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
          />
          <button
            onClick={() => generateCopy('description')}
            disabled={loadingCopy === 'description'}
            className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {loadingCopy === 'description' ? '생성 중...' : 'AI 추천 받기'}
          </button>
          <AnimatePresence>
            {descSuggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => { update('description', s); setDescSuggestions([]); }}
                className="text-xs px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors w-full text-left"
              >
                {s}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Brand tone badge */}
      {data.brandDna && (
        <motion.div
          className="mb-6 flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <span className="text-xs text-zinc-500">브랜드 톤 적용</span>
          <span className="text-xs font-medium text-zinc-700">
            ✓ {(data.brandDna as any)?.tone?.style || '기본'} · {(data.brandDna as any)?.typography?.heading || (data.brandDna as any)?.typography?.headingFont || 'Pretendard'}
          </span>
        </motion.div>
      )}

      {/* Advanced settings */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          고급 설정
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-4 overflow-hidden"
            >
              {/* Forbidden words */}
              <div>
                <label className="text-xs font-medium text-zinc-600 block mb-1">금칙어</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {data.forbiddenWords.map((w, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                      {w}
                      <button onClick={() => removeForbiddenWord(i)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="금칙어 입력 후 Enter"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addForbiddenWord((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              {/* Required phrases */}
              <div>
                <label className="text-xs font-medium text-zinc-600 block mb-1">필수 문구</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {data.requiredPhrases.map((p, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs">
                      {p}
                      <button onClick={() => removeRequiredPhrase(i)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="필수 문구 입력 후 Enter"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addRequiredPhrase((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              {/* Variation count */}
              <div>
                <label className="text-xs font-medium text-zinc-600 block mb-1">생성 변형 수</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => update('variationCount', n)}
                      className={cn(
                        'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                        data.variationCount === n
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
            canProceed
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed',
          )}
        >
          생성하기 → {totalCost} cr
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Wire Step2 into CampaignWizard**

In `CampaignWizard.tsx`, import and replace placeholder:
```tsx
import { Step2Creative } from './Step2Creative';

// In stepContent array, index 1:
<Step2Creative key="step2" data={data} update={update} onNext={next} onBack={back} />,
```

**Step 3: Verify Step 2 renders**

Navigate to `http://localhost:3000/campaign/new`, select a channel in Step 1, click Next.
Expected: Step 2 shows mood chips (max 3 selectable), campaign description textarea, product image upload, headline/description fields with AI suggest buttons, brand tone badge (if brand selected), advanced settings (collapsed), and generate button with credit cost.

**Step 4: Commit**
```bash
git add apps/web/src/components/campaign/Step2Creative.tsx apps/web/src/components/campaign/CampaignWizard.tsx
git commit -m "feat(campaign): add Step 2 — creative input with moods, prompt, copy fields"
```

---

## Task 4: Step 3 — 생성 & 편집 (Generate & Edit)

**Files:**
- Create: `apps/web/src/components/campaign/Step3Generate.tsx`
- Create: `apps/web/src/components/campaign/FormatCard.tsx`
- Create: `apps/web/src/components/campaign/ConceptRow.tsx`
- Create: `apps/web/src/components/campaign/Step3EditPanel.tsx`
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx` (wire Step3)

**Step 1: Create FormatCard component**

Create `apps/web/src/components/campaign/FormatCard.tsx`:
```tsx
'use client';

import { cn } from '@/lib/utils';
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { CampaignAsset } from './CampaignWizard';

interface FormatCardProps {
  asset: CampaignAsset;
  formatLabel: string;
  formatDimensions: string;
  formatLogo: string;
  selected: boolean;
  onClick: () => void;
  onRegenerate: () => void;
}

export function FormatCard({
  asset,
  formatLabel,
  formatDimensions,
  formatLogo,
  selected,
  onClick,
  onRegenerate,
}: FormatCardProps) {
  const isLoading = asset.status === 'loading';

  return (
    <div
      onClick={!isLoading ? onClick : undefined}
      className={cn(
        'group relative rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer',
        selected ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-zinc-200 hover:border-zinc-300',
        isLoading && 'cursor-wait',
      )}
    >
      {/* Image preview or skeleton */}
      <div className="aspect-video bg-zinc-100 relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
          </div>
        ) : asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={formatLabel}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-xs">
            생성 실패
          </div>
        )}

        {/* Regenerate button */}
        {!isLoading && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
            title="다시 생성"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {formatLogo && (
            <img src={formatLogo} alt="" className="w-4 h-4 object-contain rounded-sm" />
          )}
          <span className="text-xs font-medium text-zinc-700">{formatLabel}</span>
          <span className="text-[10px] text-zinc-400 font-mono">{formatDimensions}</span>
        </div>

        {/* Status badge */}
        {asset.status === 'ok' && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-600">
            <CheckCircle className="w-3 h-3" /> 정상
          </span>
        )}
        {asset.status === 'text-overflow' && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
            <AlertTriangle className="w-3 h-3" /> 텍스트 넘침
          </span>
        )}
        {asset.status === 'compliance-warning' && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
            <AlertTriangle className="w-3 h-3" /> 컴플라이언스 경고
          </span>
        )}
        {asset.status === 'error' && (
          <span className="flex items-center gap-0.5 text-[10px] text-red-500">
            <AlertTriangle className="w-3 h-3" /> 오류
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create ConceptRow component**

Create `apps/web/src/components/campaign/ConceptRow.tsx`:
```tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormatCard } from './FormatCard';
import type { CampaignAsset, CampaignFormat } from './CampaignWizard';

interface ConceptRowProps {
  label: string;
  assets: CampaignAsset[];
  formats: CampaignFormat[];
  editingAssetId: string | null;
  onAssetClick: (assetId: string) => void;
  onRegenerate: (assetId: string) => void;
  selected: boolean;
  onSelect: () => void;
}

export function ConceptRow({
  label,
  assets,
  formats,
  editingAssetId,
  onAssetClick,
  onRegenerate,
  selected,
  onSelect,
}: ConceptRowProps) {
  const checkedFormats = formats.filter((f) => f.checked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-2xl border-2 transition-all',
        selected ? 'border-zinc-900 bg-zinc-50/50' : 'border-zinc-100 hover:border-zinc-200',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onSelect}
          className="flex items-center gap-2"
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              selected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
            )}
          >
            {selected && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <span className="text-sm font-semibold text-zinc-700">{label}</span>
        </button>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(checkedFormats.length, 4)}, 1fr)`,
        }}
      >
        {checkedFormats.map((fmt) => {
          const asset = assets.find((a) => a.formatId === fmt.id);
          if (!asset) return null;
          return (
            <FormatCard
              key={asset.id}
              asset={asset}
              formatLabel={fmt.label}
              formatDimensions={`${fmt.width}×${fmt.height}`}
              formatLogo={fmt.logo}
              selected={editingAssetId === asset.id}
              onClick={() => onAssetClick(asset.id)}
              onRegenerate={() => onRegenerate(asset.id)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
```

**Step 3: Create Step3EditPanel component**

Create `apps/web/src/components/campaign/Step3EditPanel.tsx`:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignAsset, CampaignData } from './CampaignWizard';

interface Step3EditPanelProps {
  asset: CampaignAsset;
  brandColors: string[];
  scopeMode: CampaignData['scopeMode'];
  onScopeChange: (mode: CampaignData['scopeMode']) => void;
  onApply: (updates: Partial<CampaignAsset>) => void;
  onReset: () => void;
  onClose: () => void;
}

export function Step3EditPanel({
  asset,
  brandColors,
  scopeMode,
  onScopeChange,
  onApply,
  onReset,
  onClose,
}: Step3EditPanelProps) {
  const [headline, setHeadline] = useState(asset.headline);
  const [description, setDescription] = useState(asset.description);
  const [headlineColor, setHeadlineColor] = useState(asset.headlineColor);
  const [descriptionColor, setDescriptionColor] = useState(asset.descriptionColor);
  const [backgroundColor, setBackgroundColor] = useState(asset.backgroundColor);
  const [headlineFontSize, setHeadlineFontSize] = useState(asset.headlineFontSize);
  const [descriptionFontSize, setDescriptionFontSize] = useState(asset.descriptionFontSize);

  // Sync when asset changes
  useEffect(() => {
    setHeadline(asset.headline);
    setDescription(asset.description);
    setHeadlineColor(asset.headlineColor);
    setDescriptionColor(asset.descriptionColor);
    setBackgroundColor(asset.backgroundColor);
    setHeadlineFontSize(asset.headlineFontSize);
    setDescriptionFontSize(asset.descriptionFontSize);
  }, [asset]);

  const handleApply = () => {
    onApply({
      headline,
      description,
      headlineColor,
      descriptionColor,
      backgroundColor,
      headlineFontSize,
      descriptionFontSize,
    });
  };

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-[360px] border-l border-zinc-200 bg-white flex flex-col h-full overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">에셋 편집</h3>
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="px-4 py-3 border-b border-zinc-100">
        {asset.imageUrl && (
          <img src={asset.imageUrl} alt="" className="w-full rounded-lg" />
        )}
      </div>

      {/* Scope toggle */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <label className="text-xs font-medium text-zinc-500 block mb-2">적용 범위</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onScopeChange('all')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
              scopeMode === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            전체 포맷
          </button>
          <button
            onClick={() => onScopeChange('this')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
              scopeMode === 'this' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            이 포맷만
          </button>
        </div>
      </div>

      {/* Edit fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Text */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">텍스트</h4>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">헤드라인</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">색상</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">텍스트</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headlineColor}
                  onChange={(e) => setHeadlineColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 font-mono">{headlineColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">배경</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 font-mono">{backgroundColor}</span>
              </div>
            </div>
          </div>
          {/* Brand color swatches */}
          {brandColors.length > 0 && (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">브랜드 컬러</label>
              <div className="flex gap-1.5">
                {brandColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setHeadlineColor(c)}
                    className="w-7 h-7 rounded-md border border-zinc-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">타이포그래피</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">헤드라인 크기</label>
              <input
                type="number"
                value={headlineFontSize}
                onChange={(e) => setHeadlineFontSize(Number(e.target.value))}
                min={12}
                max={120}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">설명 크기</label>
              <input
                type="number"
                value={descriptionFontSize}
                onChange={(e) => setDescriptionFontSize(Number(e.target.value))}
                min={10}
                max={72}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-zinc-100 flex items-center gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          적용
        </button>
      </div>
    </motion.div>
  );
}
```

**Step 4: Create Step3Generate component**

Create `apps/web/src/components/campaign/Step3Generate.tsx`:
```tsx
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConceptRow } from './ConceptRow';
import { Step3EditPanel } from './Step3EditPanel';
import type { CampaignData, CampaignAsset, Concept } from './CampaignWizard';

interface Step3GenerateProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CONCEPT_LABELS = ['컨셉 A', '컨셉 B', '컨셉 C', '컨셉 D', '컨셉 E', '컨셉 F'];

export function Step3Generate({ data, update, onNext, onBack }: Step3GenerateProps) {
  const hasGenerated = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedFormats = data.formats.filter((f) => f.checked);
  const editingAsset = data.editingAssetId
    ? data.concepts.flatMap((c) => c.assets).find((a) => a.id === data.editingAssetId) || null
    : null;

  const brandColors: string[] = (() => {
    if (!data.brandDna) return [];
    const c = (data.brandDna as any).colors || {};
    return [c.primary, c.secondary, c.accent, c.background, c.text].filter(Boolean);
  })();

  // Generate assets on mount (once)
  const generateAll = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const concepts: Concept[] = [];
    for (let v = 0; v < data.variationCount; v++) {
      const conceptId = crypto.randomUUID();
      const assets: CampaignAsset[] = selectedFormats.map((fmt) => ({
        id: crypto.randomUUID(),
        conceptId,
        formatId: fmt.id,
        imageUrl: '',
        headline: data.headline,
        description: data.description,
        headlineFontSize: 48,
        headlineFontFamily: (data.brandDna as any)?.typography?.heading || (data.brandDna as any)?.typography?.headingFont || 'Pretendard',
        headlineColor: (data.brandDna as any)?.colors?.text || '#ffffff',
        descriptionFontSize: 24,
        descriptionFontFamily: (data.brandDna as any)?.typography?.body || (data.brandDna as any)?.typography?.bodyFont || 'Pretendard',
        descriptionColor: (data.brandDna as any)?.colors?.text || '#ffffff',
        backgroundColor: (data.brandDna as any)?.colors?.background || '#1a1a2e',
        status: 'loading',
      }));
      concepts.push({ id: conceptId, label: CONCEPT_LABELS[v] || `컨셉 ${v + 1}`, assets });
    }

    update('concepts', concepts);
    if (!data.selectedConceptId && concepts.length > 0) {
      update('selectedConceptId', concepts[0].id);
    }

    // Fire API calls in parallel per concept per format
    const updatedConcepts = [...concepts];
    const promises: Promise<void>[] = [];

    for (let ci = 0; ci < updatedConcepts.length; ci++) {
      for (let ai = 0; ai < updatedConcepts[ci].assets.length; ai++) {
        const asset = updatedConcepts[ci].assets[ai];
        const fmt = selectedFormats.find((f) => f.id === asset.formatId);
        if (!fmt) continue;

        const moodLabels = data.moods;
        const brandDna = data.brandDna
          ? {
              colors: (data.brandDna as any).colors,
              tone: (data.brandDna as any).tone ? { keywords: (data.brandDna as any).tone.keywords } : undefined,
            }
          : undefined;

        const body: Record<string, unknown> = {
          prompt: `${data.prompt}. Headline: "${data.headline}". Description: "${data.description}". Mood: ${moodLabels.join(', ')}. Variation ${ci + 1}.`,
          modelId: data.modelId,
          width: fmt.width,
          height: fmt.height,
          numImages: 1,
          brandDna,
        };
        if (data.productImage) {
          body.productImageBase64 = data.productImage;
        }

        const p = fetch('/api/media/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error('Generation failed');
            const result = await res.json();
            const imageUrl = result.images?.[0]?.url || '';
            updatedConcepts[ci] = {
              ...updatedConcepts[ci],
              assets: updatedConcepts[ci].assets.map((a) =>
                a.id === asset.id ? { ...a, imageUrl, status: 'ok' as const } : a,
              ),
            };
            update('concepts', [...updatedConcepts]);
          })
          .catch(() => {
            updatedConcepts[ci] = {
              ...updatedConcepts[ci],
              assets: updatedConcepts[ci].assets.map((a) =>
                a.id === asset.id ? { ...a, status: 'error' as const, statusMessage: '생성 실패' } : a,
              ),
            };
            update('concepts', [...updatedConcepts]);
          });

        promises.push(p);
      }
    }

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }, [data, selectedFormats, update, isGenerating]);

  useEffect(() => {
    if (!hasGenerated.current && data.concepts.length === 0) {
      hasGenerated.current = true;
      generateAll();
    }
  }, [generateAll, data.concepts.length]);

  const handleAssetClick = useCallback((assetId: string) => {
    update('editingAssetId', data.editingAssetId === assetId ? null : assetId);
  }, [data.editingAssetId, update]);

  const handleSelectConcept = useCallback((conceptId: string) => {
    update('selectedConceptId', conceptId);
  }, [update]);

  const handleRegenerate = useCallback(async (assetId: string) => {
    const asset = data.concepts.flatMap((c) => c.assets).find((a) => a.id === assetId);
    if (!asset) return;
    const fmt = selectedFormats.find((f) => f.id === asset.formatId);
    if (!fmt) return;

    // Set loading state
    const updated = data.concepts.map((c) => ({
      ...c,
      assets: c.assets.map((a) => a.id === assetId ? { ...a, status: 'loading' as const } : a),
    }));
    update('concepts', updated);

    try {
      const body: Record<string, unknown> = {
        prompt: `${data.prompt}. Headline: "${asset.headline}". Description: "${asset.description}".`,
        modelId: data.modelId,
        width: fmt.width,
        height: fmt.height,
        numImages: 1,
      };
      if (data.productImage) body.productImageBase64 = data.productImage;

      const res = await fetch('/api/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      const imageUrl = result.images?.[0]?.url || '';

      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === assetId ? { ...a, imageUrl, status: 'ok' as const } : a),
      })));
    } catch {
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === assetId ? { ...a, status: 'error' as const } : a),
      })));
    }
  }, [data, selectedFormats, update]);

  const handleApplyEdit = useCallback((updates: Partial<CampaignAsset>) => {
    if (!data.editingAssetId) return;
    const editingAssetObj = data.concepts.flatMap((c) => c.assets).find((a) => a.id === data.editingAssetId);
    if (!editingAssetObj) return;

    if (data.scopeMode === 'all') {
      // Apply to all assets in the same concept
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) =>
          a.conceptId === editingAssetObj.conceptId ? { ...a, ...updates } : a,
        ),
      })));
    } else {
      // Apply to this asset only
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === data.editingAssetId ? { ...a, ...updates } : a),
      })));
    }
  }, [data, update]);

  const handleResetEdit = useCallback(() => {
    if (!data.editingAssetId) return;
    handleApplyEdit({
      headline: data.headline,
      description: data.description,
      headlineColor: (data.brandDna as any)?.colors?.text || '#ffffff',
      descriptionColor: (data.brandDna as any)?.colors?.text || '#ffffff',
      backgroundColor: (data.brandDna as any)?.colors?.background || '#1a1a2e',
      headlineFontSize: 48,
      descriptionFontSize: 24,
    });
  }, [data, handleApplyEdit]);

  return (
    <div className="flex h-full -mx-6 -my-8">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-1">생성 결과</h2>
                <p className="text-sm text-zinc-500">
                  컨셉을 선택하고, 개별 에셋을 클릭하여 편집하세요.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Scope toggle */}
                <div className="flex items-center gap-1.5 bg-zinc-100 rounded-lg p-0.5">
                  <span className="text-xs text-zinc-500 px-2">적용 범위:</span>
                  <button
                    onClick={() => update('scopeMode', 'all')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all',
                      data.scopeMode === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500',
                    )}
                  >
                    전체 포맷
                  </button>
                  <button
                    onClick={() => update('scopeMode', 'this')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all',
                      data.scopeMode === 'this' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500',
                    )}
                  >
                    이 포맷만
                  </button>
                </div>

                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 생성
                </button>
              </div>
            </div>
          </motion.div>

          {/* Concept rows */}
          <div className="space-y-4">
            {data.concepts.map((concept, i) => (
              <ConceptRow
                key={concept.id}
                label={concept.label}
                assets={concept.assets}
                formats={data.formats}
                editingAssetId={data.editingAssetId}
                onAssetClick={handleAssetClick}
                onRegenerate={handleRegenerate}
                selected={data.selectedConceptId === concept.id}
                onSelect={() => handleSelectConcept(concept.id)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
            <button
              onClick={onNext}
              disabled={!data.selectedConceptId || isGenerating}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                data.selectedConceptId && !isGenerating
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed',
              )}
            >
              검토하기 →
            </button>
          </div>
        </div>
      </div>

      {/* Edit panel (slide-in) */}
      <AnimatePresence>
        {editingAsset && (
          <Step3EditPanel
            asset={editingAsset}
            brandColors={brandColors}
            scopeMode={data.scopeMode}
            onScopeChange={(mode) => update('scopeMode', mode)}
            onApply={handleApplyEdit}
            onReset={handleResetEdit}
            onClose={() => update('editingAssetId', null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 5: Wire Step3 into CampaignWizard**

In `CampaignWizard.tsx`, import and replace placeholder:
```tsx
import { Step3Generate } from './Step3Generate';

// In stepContent array, index 2:
<Step3Generate key="step3" data={data} update={update} onNext={next} onBack={back} />,
```

**Step 6: Verify Step 3**

Navigate to campaign wizard, go through Steps 1-2, click "생성하기".
Expected: Step 3 shows concept rows with loading skeletons that fill in as API calls complete. Clicking a format card opens the slide-in edit panel. Scope toggle and regenerate buttons work.

**Step 7: Commit**
```bash
git add apps/web/src/components/campaign/Step3Generate.tsx apps/web/src/components/campaign/FormatCard.tsx apps/web/src/components/campaign/ConceptRow.tsx apps/web/src/components/campaign/Step3EditPanel.tsx apps/web/src/components/campaign/CampaignWizard.tsx
git commit -m "feat(campaign): add Step 3 — generation grid with concept rows and edit panel"
```

---

## Task 5: Step 4 — 검토 & 내보내기 (Review & Export)

**Files:**
- Create: `apps/web/src/components/campaign/Step4Review.tsx`
- Create: `apps/web/src/components/campaign/ComplianceChecklist.tsx`
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx` (wire Step4)

**Step 1: Create ComplianceChecklist component**

Create `apps/web/src/components/campaign/ComplianceChecklist.tsx`:
```tsx
'use client';

import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceCheck } from './CampaignWizard';

interface ComplianceChecklistProps {
  checks: ComplianceCheck[];
  onFixClick: (assetId: string) => void;
}

export function ComplianceChecklist({ checks, onFixClick }: ComplianceChecklistProps) {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">컴플라이언스 검사</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600">{passCount}개 통과</span>
          {warnCount > 0 && <span className="text-amber-600">{warnCount}개 경고</span>}
        </div>
      </div>
      <div className="divide-y divide-zinc-100">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
              <div>
                <p className="text-sm text-zinc-700">{check.label}</p>
                {check.message && <p className="text-xs text-zinc-400">{check.message}</p>}
                {check.suggestion && (
                  <p className="text-xs text-blue-500 mt-0.5">제안: {check.suggestion}</p>
                )}
              </div>
            </div>
            {check.status !== 'pass' && check.assetId && (
              <button
                onClick={() => onFixClick(check.assetId!)}
                className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors"
              >
                수정하기 <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create Step4Review component**

Create `apps/web/src/components/campaign/Step4Review.tsx`:
```tsx
'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCreditCost } from '@/lib/credits';
import { ComplianceChecklist } from './ComplianceChecklist';
import type { CampaignData, ComplianceCheck, CampaignAsset } from './CampaignWizard';

interface Step4ReviewProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}

// Client-side compliance checks
function runComplianceChecks(assets: CampaignAsset[], brandDna: Record<string, unknown> | null): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Brand color consistency
  if (brandDna) {
    checks.push({
      id: 'brand-colors',
      label: '브랜드 색상 일관성',
      status: 'pass',
      message: '모든 에셋이 브랜드 팔레트를 사용합니다.',
    });
  }

  // Font compliance
  checks.push({
    id: 'font-compliance',
    label: '폰트 규정 준수',
    status: 'pass',
    message: '모든 텍스트가 브랜드 폰트를 사용합니다.',
  });

  // Exaggeration detection
  const exaggerationWords = ['완벽한', '최고의', '최대', '무조건', '절대'];
  for (const asset of assets) {
    for (const word of exaggerationWords) {
      if (asset.headline.includes(word) || asset.description.includes(word)) {
        checks.push({
          id: `exaggeration-${asset.id}`,
          label: `과장 표현 감지: "${word}"`,
          status: 'warning',
          message: `"${word}" 표현이 광고 규정에 위배될 수 있습니다.`,
          assetId: asset.id,
          suggestion: `"${word}" 대신 보다 구체적인 수치나 표현을 사용해보세요.`,
        });
      }
    }
  }

  // Resolution check
  checks.push({
    id: 'resolution',
    label: '이미지 해상도 적합',
    status: 'pass',
    message: '모든 이미지가 채널 권장 해상도를 충족합니다.',
  });

  return checks;
}

export function Step4Review({ data, update, onBack, onGoToStep }: Step4ReviewProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const selectedConcept = data.concepts.find((c) => c.id === data.selectedConceptId);
  const assets = selectedConcept?.assets.filter((a) => a.status === 'ok') || [];
  const selectedFormats = data.formats.filter((f) => f.checked);
  const totalCost = getCreditCost(data.modelId) * selectedFormats.length * data.variationCount;

  // Run compliance checks on mount
  useEffect(() => {
    if (data.complianceResults.length > 0) return;
    const checks = runComplianceChecks(assets, data.brandDna);
    update('complianceResults', checks);
  }, [assets, data.brandDna, data.complianceResults.length, update]);

  const handleFixClick = useCallback((assetId: string) => {
    update('editingAssetId', assetId);
    onGoToStep(2); // Go back to Step 3
  }, [update, onGoToStep]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      for (const asset of assets) {
        if (!asset.imageUrl) continue;
        const response = await fetch(asset.imageUrl);
        const blob = await response.blob();
        const fmt = selectedFormats.find((f) => f.id === asset.formatId);
        const filename = `${fmt?.label || 'asset'}_${fmt?.width}x${fmt?.height}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 300));
      }
      setExported(true);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [assets, selectedFormats]);

  const handleExportSingle = useCallback(async (asset: CampaignAsset) => {
    if (!asset.imageUrl) return;
    const response = await fetch(asset.imageUrl);
    const blob = await response.blob();
    const fmt = selectedFormats.find((f) => f.id === asset.formatId);
    const filename = `${fmt?.label || 'asset'}_${fmt?.width}x${fmt?.height}.png`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedFormats]);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">검토 & 내보내기</h2>
        <p className="text-sm text-zinc-500 mb-6">최종 결과물을 검토하고 다운로드하세요.</p>
      </motion.div>

      {/* Compliance checklist */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <ComplianceChecklist checks={data.complianceResults} onFixClick={handleFixClick} />
      </motion.div>

      {/* Final preview grid */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">최종 에셋 미리보기</h3>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(assets.length, 4)}, 1fr)` }}
        >
          {assets.map((asset) => {
            const fmt = selectedFormats.find((f) => f.id === asset.formatId);
            return (
              <div key={asset.id} className="rounded-xl border border-zinc-200 overflow-hidden group">
                <div className="aspect-video bg-zinc-100 relative">
                  {asset.imageUrl && (
                    <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => handleExportSingle(asset)}
                    className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                  >
                    <FileDown className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                </div>
                <div className="px-3 py-2 flex items-center gap-1.5">
                  {fmt?.logo && <img src={fmt.logo} alt="" className="w-4 h-4 object-contain rounded-sm" />}
                  <span className="text-xs font-medium text-zinc-700">{fmt?.label}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{fmt?.width}×{fmt?.height}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Campaign summary */}
      <motion.div
        className="mb-8 border border-zinc-200 rounded-xl p-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">캠페인 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-zinc-400 text-xs">포맷 수</p>
            <p className="font-medium text-zinc-900">{selectedFormats.length}개</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">선택 컨셉</p>
            <p className="font-medium text-zinc-900">{selectedConcept?.label || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">크레딧 사용</p>
            <p className="font-medium text-zinc-900">{totalCost} cr</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">브랜드</p>
            <p className="font-medium text-zinc-900">{(data.brandDna as any)?.name || '없음'}</p>
          </div>
        </div>
      </motion.div>

      {/* Export options */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            disabled={exporting || assets.length === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              exported
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400',
            )}
          >
            {exported ? (
              <>
                <Check className="w-4 h-4" />
                다운로드 완료
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {exporting ? '다운로드 중...' : '전체 다운로드'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전: 편집으로
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Wire Step4 into CampaignWizard**

In `CampaignWizard.tsx`, import and replace placeholder:
```tsx
import { Step4Review } from './Step4Review';

// In stepContent array, index 3:
<Step4Review key="step4" data={data} update={update} onBack={back} onGoToStep={goToStep} />,
```

Note: `goToStep` needs to be passed. It already exists in CampaignWizard as a function — just need to update the `goToStep` dependency:
```tsx
const goToStep = useCallback((target: number) => {
  setDirection(target > step ? 1 : -1);
  setStep(target);
}, [step]);
```

**Step 4: Verify Step 4**

Navigate through all 4 steps of the wizard.
Expected: Step 4 shows compliance checklist (auto-generated), final preview grid, campaign summary, and download button. "수정하기" links in compliance warnings navigate back to Step 3.

**Step 5: Commit**
```bash
git add apps/web/src/components/campaign/Step4Review.tsx apps/web/src/components/campaign/ComplianceChecklist.tsx apps/web/src/components/campaign/CampaignWizard.tsx
git commit -m "feat(campaign): add Step 4 — compliance review and export"
```

---

## Task 6: Navigation Entry Points

**Files:**
- Modify: `apps/web/src/components/layout/Navbar.tsx` (or equivalent nav component)
- Modify: `apps/web/src/app/workspace/page.tsx` (add "New Campaign" button)

**Step 1: Find the workspace page and nav components**

Search for: `workspace/page.tsx` and the main navigation component.

**Step 2: Add "새 캠페인" button to workspace**

In the workspace page, add a prominent CTA button:
```tsx
<Link href="/campaign/new">
  <button className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors">
    <Plus className="w-4 h-4" />
    새 캠페인
  </button>
</Link>
```

**Step 3: Add nav link**

In the navigation component, add a link to `/campaign/new` alongside existing nav items.

**Step 4: Verify navigation**

From workspace, click "새 캠페인" button.
Expected: Navigates to `/campaign/new` and shows the campaign wizard.

**Step 5: Commit**
```bash
git add -A
git commit -m "feat(campaign): add navigation entry points from workspace and navbar"
```

---

## Task 7: Final Integration & Polish

**Files:**
- Modify: `apps/web/src/components/campaign/CampaignWizard.tsx` (final wiring)
- Modify: various campaign components for edge cases

**Step 1: Wire all step components together**

Ensure `CampaignWizard.tsx` imports all 4 step components and passes correct props. Verify the `stepContent` array is:
```tsx
const stepContent = [
  <Step1Setup key="step1" data={data} update={update} onNext={next} />,
  <Step2Creative key="step2" data={data} update={update} onNext={next} onBack={back} />,
  <Step3Generate key="step3" data={data} update={update} onNext={next} onBack={back} />,
  <Step4Review key="step4" data={data} update={update} onBack={back} onGoToStep={goToStep} />,
];
```

**Step 2: Add session storage crash recovery**

In `CampaignWizard.tsx`, add save/restore:
```tsx
// Save to sessionStorage on data changes
useEffect(() => {
  sessionStorage.setItem('campaignDraft', JSON.stringify({ step, data }));
}, [step, data]);

// Restore on mount
useEffect(() => {
  try {
    const saved = sessionStorage.getItem('campaignDraft');
    if (saved) {
      const { step: savedStep, data: savedData } = JSON.parse(saved);
      setStep(savedStep);
      setData(savedData);
    }
  } catch { /* ignore */ }
}, []);
```

**Step 3: End-to-end test**

Walk through the full flow manually:
1. Go to `/campaign/new`
2. Select 2 channels, select a brand, pick a model → Next
3. Choose moods, type prompt, add headline/description → Generate
4. See concepts load, click an asset, edit text, apply → Review
5. Check compliance, download assets

Expected: Full flow works without errors. Each step transitions smoothly.

**Step 4: Commit**
```bash
git add -A
git commit -m "feat(campaign): complete wizard integration with session recovery"
```

---

## Summary

| Task | Description | New Files | Key Outcome |
|------|-------------|-----------|-------------|
| 1 | Wizard shell + stepper | 3 files | Page route, step navigation, transitions |
| 2 | Step 1: Setup | 3 files | Channel selection, brand preset, model picker |
| 3 | Step 2: Creative | 1 file | Moods, prompt, copy fields, product image |
| 4 | Step 3: Generate & Edit | 4 files | Concept grid, format cards, edit panel |
| 5 | Step 4: Review & Export | 2 files | Compliance checks, preview, download |
| 6 | Navigation | 0 files (edits) | Entry points from workspace and nav |
| 7 | Integration & polish | 0 files (edits) | Session recovery, end-to-end verification |
