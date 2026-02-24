'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Coffee,
  Monitor,
  ShoppingBag,
  GraduationCap,
  Heart,
  Building2,
  Banknote,
  Plane,
  Megaphone,
  Search,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CAMPAIGN_TEMPLATES,
  type CampaignTemplate,
} from '@/lib/campaign-templates';

// ─── Props ──────────────────────────────────────────────────

interface TemplateGalleryProps {
  onSelect: (template: CampaignTemplate) => void;
  onSkip: () => void;
}

// ─── Icon & industry mappings ───────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Sparkles,
  Coffee,
  Monitor,
  ShoppingBag,
  GraduationCap,
  Heart,
  Building2,
  Banknote,
  Plane,
  Megaphone,
  Search,
};

const INDUSTRY_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'beauty', label: '뷰티·패션' },
  { id: 'fnb', label: 'F&B' },
  { id: 'tech', label: '테크·IT' },
  { id: 'ecommerce', label: '이커머스' },
  { id: 'education', label: '교육' },
  { id: 'healthcare', label: '헬스케어' },
  { id: 'realestate', label: '부동산' },
  { id: 'finance', label: '금융' },
  { id: 'travel', label: '여행' },
  { id: 'general', label: '종합' },
];

const MOOD_COLORS: Record<string, string> = {
  minimal: 'bg-zinc-300',
  modern: 'bg-blue-400',
  warm: 'bg-amber-400',
  bold: 'bg-red-500',
  luxury: 'bg-yellow-500',
  natural: 'bg-green-400',
  retro: 'bg-orange-400',
  tech: 'bg-cyan-400',
  cute: 'bg-pink-300',
  elegant: 'bg-purple-400',
};

const MOOD_LABELS: Record<string, string> = {
  minimal: '미니멀',
  modern: '모던',
  warm: '따뜻한',
  bold: '대담한',
  luxury: '럭셔리',
  natural: '자연적',
  retro: '레트로',
  tech: '테크',
  cute: '귀여운',
  elegant: '우아한',
};

// ─── Component ──────────────────────────────────────────────

export function TemplateGallery({ onSelect, onSkip }: TemplateGalleryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const filteredTemplates = useMemo(
    () =>
      selectedIndustry === 'all'
        ? CAMPAIGN_TEMPLATES
        : CAMPAIGN_TEMPLATES.filter((t) => t.industry === selectedIndustry),
    [selectedIndustry],
  );

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <LayoutGrid className="w-5 h-5 text-pink-500" />
          <h2 className="text-xl font-semibold text-zinc-900">
            템플릿으로 시작하기
          </h2>
        </div>
        <p className="text-sm text-zinc-500">
          업종별 추천 템플릿으로 빠르게 시작하세요.
        </p>
      </motion.div>

      {/* Industry filter chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="mb-6 -mx-2 px-2 overflow-x-auto scrollbar-hide"
      >
        <div className="flex items-center gap-2 pb-1 min-w-max">
          {INDUSTRY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedIndustry(filter.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
                selectedIndustry === filter.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Template grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndustry}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredTemplates.map((template, i) => {
            const IconComponent = ICON_MAP[template.icon] || Megaphone;

            return (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.05 * i,
                  duration: 0.35,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
                onClick={() => onSelect(template)}
                className={cn(
                  'group relative flex flex-col text-left p-5 rounded-xl border border-zinc-200',
                  'bg-white hover:border-pink-300 hover:shadow-sm',
                  'transition-all duration-200 cursor-pointer',
                )}
              >
                {/* Icon + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 group-hover:bg-pink-50 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                    <IconComponent
                      size={18}
                      className="text-zinc-500 group-hover:text-pink-500 transition-colors duration-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-pink-600 transition-colors duration-200">
                      {template.nameKo}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                      {template.descriptionKo}
                    </p>
                  </div>
                </div>

                {/* Mood chips */}
                <div className="flex items-center gap-1.5 mb-3">
                  {template.moods.map((mood) => (
                    <span
                      key={mood}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-50 text-[10px] font-medium text-zinc-500"
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          MOOD_COLORS[mood] || 'bg-zinc-300',
                        )}
                      />
                      {MOOD_LABELS[mood] || mood}
                    </span>
                  ))}
                </div>

                {/* Channel count + arrow */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-medium text-zinc-400">
                    {template.channelPresetIds.length}개 채널
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-zinc-300 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all duration-200"
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-sm text-zinc-400">
            해당 업종의 템플릿이 아직 없습니다.
          </p>
        </motion.div>
      )}

      {/* Skip button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-8 text-center"
      >
        <button
          onClick={onSkip}
          className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          직접 설정하기
        </button>
      </motion.div>
    </div>
  );
}
