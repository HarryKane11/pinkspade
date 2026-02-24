'use client';

import { cn } from '@/lib/utils';
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { CampaignAsset } from './CampaignWizard';

interface FormatCardProps {
  asset: CampaignAsset;
  formatLabel: string;
  formatDimensions: string;
  formatLogo: string;
  formatWidth: number;
  formatHeight: number;
  selected: boolean;
  onClick: () => void;
  onRegenerate: () => void;
}

export function FormatCard({
  asset,
  formatLabel,
  formatDimensions,
  formatLogo,
  formatWidth,
  formatHeight,
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
      <div
        className="bg-zinc-100 relative overflow-hidden"
        style={{ aspectRatio: `${formatWidth} / ${formatHeight}`, maxHeight: 280 }}
      >
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
