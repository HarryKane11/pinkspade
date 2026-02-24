'use client';

import { AlertTriangle } from 'lucide-react';
import { getCreditCost } from '@/lib/credits';
import { useCreditBalance } from '@/contexts/credit-context';

interface CreditEstimatorProps {
  modelId: string;
  formatCount: number;
  variationCount: number;
}

export function CreditEstimator({ modelId, formatCount, variationCount }: CreditEstimatorProps) {
  const balance = useCreditBalance();

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
