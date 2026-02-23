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
