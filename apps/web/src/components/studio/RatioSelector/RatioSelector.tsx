'use client';

import { useCallback } from 'react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import type { BackgroundLayer } from '@/lib/shared';
import { cn } from '@/lib/utils';

const RATIO_PRESETS = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080, icon: '■' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, icon: '▯' },
  { id: '16:9', label: '16:9', width: 1920, height: 1080, icon: '▬' },
  { id: '4:5', label: '4:5', width: 1080, height: 1350, icon: '▮' },
] as const;

export function RatioSelector() {
  const design = useStudio((s) => s.design);
  const { updateCanvas, updateLayer } = useStudioActions();

  const currentWidth = design?.canvas.width ?? 1080;
  const currentHeight = design?.canvas.height ?? 1080;

  const currentRatio = RATIO_PRESETS.find(
    (r) => r.width === currentWidth && r.height === currentHeight
  )?.id ?? 'custom';

  const handleRatioChange = useCallback(
    (preset: (typeof RATIO_PRESETS)[number]) => {
      if (!design) return;

      updateCanvas({ width: preset.width, height: preset.height });

      // Also update background layer size to match
      const bgLayer = design.layers.find((l) => l.type === 'background') as BackgroundLayer | undefined;
      if (bgLayer) {
        updateLayer(bgLayer.id, {
          size: { width: preset.width, height: preset.height },
        });
      }
    },
    [design, updateCanvas, updateLayer]
  );

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg px-1.5 py-1 shadow-sm">
      {RATIO_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => handleRatioChange(preset)}
          className={cn(
            'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
            currentRatio === preset.id
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          )}
          title={`${preset.width} × ${preset.height}`}
        >
          {preset.label}
        </button>
      ))}
      <span className="text-[10px] text-zinc-400 font-mono ml-1.5 pl-1.5 border-l border-zinc-200">
        {currentWidth}×{currentHeight}
      </span>
    </div>
  );
}
