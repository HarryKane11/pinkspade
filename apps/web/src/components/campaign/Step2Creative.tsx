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
            {data.brandDna?.tone?.style || '기본'} · {data.brandDna?.typography?.heading || data.brandDna?.typography?.headingFont || 'Pretendard'}
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
