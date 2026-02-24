'use client';

import { Palette, Type, MessageSquare, RefreshCw } from 'lucide-react';
import type { CampaignBrandDna } from './CampaignWizard';

interface BrandPresetCardProps {
  brandDna: CampaignBrandDna | null;
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
