'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import type { BackgroundLayer } from '@/lib/shared';
import { getCategories, getPresetsByCategory, type ChannelPreset } from '@/lib/shared/channel-presets';
import { cn } from '@/lib/utils';

const QUICK_PRESETS = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
  { id: '9:16', label: '9:16', width: 1080, height: 1920 },
  { id: '16:9', label: '16:9', width: 1920, height: 1080 },
  { id: '4:5', label: '4:5', width: 1080, height: 1350 },
] as const;

export function RatioSelector() {
  const design = useStudio((s) => s.design);
  const { updateCanvas, updateLayer } = useStudioActions();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentWidth = design?.canvas.width ?? 1080;
  const currentHeight = design?.canvas.height ?? 1080;

  const currentQuickRatio = QUICK_PRESETS.find(
    (r) => r.width === currentWidth && r.height === currentHeight
  )?.id;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const applySize = useCallback(
    (width: number, height: number) => {
      if (!design) return;
      updateCanvas({ width, height });

      // Also update background layer size to match
      const bgLayer = design.layers.find((l) => l.type === 'background') as BackgroundLayer | undefined;
      if (bgLayer) {
        updateLayer(bgLayer.id, {
          size: { width, height },
        });
      }
    },
    [design, updateCanvas, updateLayer]
  );

  const handleQuickPreset = useCallback(
    (preset: (typeof QUICK_PRESETS)[number]) => {
      applySize(preset.width, preset.height);
    },
    [applySize]
  );

  const handleChannelPreset = useCallback(
    (preset: ChannelPreset) => {
      applySize(preset.width, preset.height);
      setShowDropdown(false);
    },
    [applySize]
  );

  const categories = getCategories();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg px-1.5 py-1 shadow-sm">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleQuickPreset(preset)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
              currentQuickRatio === preset.id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            )}
            title={`${preset.width} × ${preset.height}`}
          >
            {preset.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-4 bg-zinc-200 mx-0.5" />

        {/* Channel presets dropdown trigger */}
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all',
            showDropdown
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          )}
          title="채널 프리셋"
        >
          채널
          <ChevronDown className="w-3 h-3" />
        </button>

        <span className="text-[10px] text-zinc-400 font-mono ml-1 pl-1.5 border-l border-zinc-200">
          {currentWidth}×{currentHeight}
        </span>
      </div>

      {/* Channel preset dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl z-50">
          {categories.map((cat) => {
            const presets = getPresetsByCategory(cat.id);
            if (presets.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50 sticky top-0">
                  {cat.nameKo}
                </div>
                {presets.map((preset) => {
                  const isActive = preset.width === currentWidth && preset.height === currentHeight;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleChannelPreset(preset)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium truncate">{preset.nameKo}</div>
                        <div className={cn('text-[9px] truncate', isActive ? 'text-zinc-400' : 'text-zinc-400')}>
                          {preset.nameEn}
                        </div>
                      </div>
                      <span className={cn('text-[10px] font-mono flex-shrink-0 ml-2', isActive ? 'text-zinc-300' : 'text-zinc-400')}>
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
