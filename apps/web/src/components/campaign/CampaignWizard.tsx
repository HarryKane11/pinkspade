'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { CampaignStepper } from './CampaignStepper';
import { Step1Setup } from './Step1Setup';
import { Step2Creative } from './Step2Creative';
import { Step3Generate } from './Step3Generate';
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
    <Step1Setup key="step1" data={data} update={update} onNext={next} />,
    <Step2Creative key="step2" data={data} update={update} onNext={next} onBack={back} />,
    <Step3Generate key="step3" data={data} update={update} onNext={next} onBack={back} />,
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
