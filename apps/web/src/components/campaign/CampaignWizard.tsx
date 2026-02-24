'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { CampaignStepper } from './CampaignStepper';
import { Step1Setup } from './Step1Setup';
import { Step2Creative } from './Step2Creative';
import { Step3Generate } from './Step3Generate';
import { Step4Review } from './Step4Review';
import { saveCampaign, getCampaignById } from '@/lib/campaign-storage';
// Types
export interface CampaignBrandDna {
  id?: string;
  name?: string;
  brandName?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    palette?: string[];
  };
  typography?: {
    heading?: string;
    headingFont?: string;
    body?: string;
    bodyFont?: string;
    style?: string;
  };
  tone?: {
    style?: string;
    keywords?: string[];
    metrics?: Record<string, number>;
    voiceDescription?: string;
  };
}

export interface CampaignFormat {
  id: string;
  label: string;
  channelId: string;
  logo: string;
  width: number;
  height: number;
  checked: boolean;
}

export interface TextBox {
  id: string;
  type: 'headline' | 'description';
  x: number;       // % from left (0-100)
  y: number;       // % from top (0-100)
  width: number;   // % of container width
  height: number;  // % of container height
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
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
  textBoxes: TextBox[];
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
  id?: string; // Supabase campaign ID (undefined for new campaigns)
  // Step 1
  formats: CampaignFormat[];
  brandId: string | null;
  brandDna: CampaignBrandDna | null;
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
  id: undefined,
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

interface CampaignWizardProps {
  campaignId?: string | null;
}

export function CampaignWizard({ campaignId }: CampaignWizardProps = {}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<CampaignData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const prevStepRef = useRef(step);

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

  // Save draft to Supabase
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const campaign = await saveCampaign({
        id: data.id,
        name: data.brandDna?.brandName
          ? `${data.brandDna.brandName} 캠페인`
          : `캠페인 ${new Date().toLocaleDateString('ko-KR')}`,
        brandId: data.brandId,
        prompt: data.prompt,
        status: 'draft',
        targetChannels: data.formats.filter(f => f.checked).map(f => f.id),
        moods: data.moods,
        modelId: data.modelId,
        variationCount: data.variationCount,
        headline: data.headline,
        description: data.description,
        metadata: { step, data },
      });
      if (campaign) {
        setData(prev => ({ ...prev, id: campaign.id }));
      }
    } finally {
      setSaving(false);
    }
  }, [step, data]);

  // Auto-save when Step 4 completes (transition to step 3 → step index 3)
  useEffect(() => {
    if (step === 3 && prevStepRef.current === 2) {
      // Entered Step 4 — auto-save as completed
      const autoSave = async () => {
        const campaign = await saveCampaign({
          id: data.id,
          name: data.brandDna?.brandName
            ? `${data.brandDna.brandName} 캠페인`
            : `캠페인 ${new Date().toLocaleDateString('ko-KR')}`,
          brandId: data.brandId,
          prompt: data.prompt,
          status: 'completed',
          targetChannels: data.formats.filter(f => f.checked).map(f => f.id),
          moods: data.moods,
          modelId: data.modelId,
          variationCount: data.variationCount,
          headline: data.headline,
          description: data.description,
          metadata: { step, data },
        });
        if (campaign) {
          setData(prev => ({ ...prev, id: campaign.id }));
        }
      };
      autoSave();
    }
    prevStepRef.current = step;
  }, [step, data]);

  // Save to sessionStorage on data changes
  useEffect(() => {
    sessionStorage.setItem('campaignDraft', JSON.stringify({ step, data }));
  }, [step, data]);

  // Restore on mount: load from Supabase if campaignId, else sessionStorage
  useEffect(() => {
    if (campaignId) {
      getCampaignById(campaignId).then((campaign) => {
        if (campaign?.metadata) {
          const meta = campaign.metadata as { step?: number; data?: CampaignData };
          const savedData = meta.data;
          const savedStep = meta.step;
          if (savedData) {
            // Normalize arrays
            if (!Array.isArray(savedData.formats)) savedData.formats = [];
            if (!Array.isArray(savedData.moods)) savedData.moods = [];
            if (!Array.isArray(savedData.forbiddenWords)) savedData.forbiddenWords = [];
            if (!Array.isArray(savedData.requiredPhrases)) savedData.requiredPhrases = [];
            if (!Array.isArray(savedData.concepts)) savedData.concepts = [];
            if (!Array.isArray(savedData.complianceResults)) savedData.complianceResults = [];
            for (const concept of savedData.concepts) {
              if (!Array.isArray(concept.assets)) { concept.assets = []; continue; }
              for (const asset of concept.assets) {
                if (!Array.isArray(asset.textBoxes)) asset.textBoxes = [];
              }
            }
            savedData.id = campaign.id;
            setData(savedData);
            if (typeof savedStep === 'number') setStep(savedStep);
          }
        }
      });
      return;
    }

    try {
      const saved = sessionStorage.getItem('campaignDraft');
      if (saved) {
        const { step: savedStep, data: savedData } = JSON.parse(saved);
        if (!Array.isArray(savedData.formats)) savedData.formats = [];
        if (!Array.isArray(savedData.moods)) savedData.moods = [];
        if (!Array.isArray(savedData.forbiddenWords)) savedData.forbiddenWords = [];
        if (!Array.isArray(savedData.requiredPhrases)) savedData.requiredPhrases = [];
        if (!Array.isArray(savedData.concepts)) savedData.concepts = [];
        if (!Array.isArray(savedData.complianceResults)) savedData.complianceResults = [];
        for (const concept of savedData.concepts) {
          if (!Array.isArray(concept.assets)) { concept.assets = []; continue; }
          for (const asset of concept.assets) {
            if (!Array.isArray(asset.textBoxes)) asset.textBoxes = [];
          }
        }
        setStep(savedStep);
        setData(savedData);
      }
    } catch {
      sessionStorage.removeItem('campaignDraft');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure all array fields are arrays before passing to children
  // This guards against corrupted session data that may have non-array values
  const safeData = useMemo<CampaignData>(() => ({
    ...data,
    formats: Array.isArray(data.formats) ? data.formats : [],
    moods: Array.isArray(data.moods) ? data.moods : [],
    forbiddenWords: Array.isArray(data.forbiddenWords) ? data.forbiddenWords : [],
    requiredPhrases: Array.isArray(data.requiredPhrases) ? data.requiredPhrases : [],
    concepts: Array.isArray(data.concepts)
      ? data.concepts.map((c) => ({
          ...c,
          assets: Array.isArray(c.assets)
            ? c.assets.map((a) => ({ ...a, textBoxes: Array.isArray(a.textBoxes) ? a.textBoxes : [] }))
            : [],
        }))
      : [],
    complianceResults: Array.isArray(data.complianceResults) ? data.complianceResults : [],
  }), [data]);

  const stepContent = [
    <Step1Setup key="step1" data={safeData} update={update} onNext={next} />,
    <Step2Creative key="step2" data={safeData} update={update} onNext={next} onBack={back} />,
    <Step3Generate key="step3" data={safeData} update={update} onNext={next} onBack={back} />,
    <Step4Review key="step4" data={safeData} update={update} onBack={back} onGoToStep={goToStep} />,
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
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
