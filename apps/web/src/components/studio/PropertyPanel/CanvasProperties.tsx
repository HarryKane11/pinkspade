'use client';

import type { Canvas } from '@/lib/shared';
import { CHANNEL_PRESETS, getCategories } from '@/lib/shared';

interface CanvasPropertiesProps {
  canvas: Canvas;
  onChange: (updates: Partial<Canvas>) => void;
}

export function CanvasProperties({ canvas, onChange }: CanvasPropertiesProps) {
  const categories = getCategories();

  const handlePresetChange = (presetId: string) => {
    const preset = CHANNEL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({
        width: preset.width,
        height: preset.height,
      });
    }
  };

  // Find current preset based on dimensions
  const currentPreset = CHANNEL_PRESETS.find(
    (p) => p.width === canvas.width && p.height === canvas.height
  );

  return (
    <div className="p-4 space-y-4">
      {/* Canvas size */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          캔버스 크기
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs mb-1 block">너비</label>
            <input
              type="number"
              value={canvas.width}
              onChange={(e) =>
                onChange({ width: Math.max(100, parseInt(e.target.value) || 800) })
              }
              className="input h-8 text-sm"
              min={100}
              max={4096}
            />
          </div>
          <div>
            <label className="label text-xs mb-1 block">높이</label>
            <input
              type="number"
              value={canvas.height}
              onChange={(e) =>
                onChange({ height: Math.max(100, parseInt(e.target.value) || 600) })
              }
              className="input h-8 text-sm"
              min={100}
              max={4096}
            />
          </div>
        </div>
      </div>

      {/* Channel presets */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          채널 프리셋
        </h4>

        <div className="space-y-3">
          {categories.map((category) => {
            const presets = CHANNEL_PRESETS.filter(
              (p) => p.category === category.id
            );
            if (presets.length === 0) return null;

            return (
              <div key={category.id}>
                <label className="label text-xs mb-1 block">{category.nameKo}</label>
                <select
                  value={currentPreset?.category === category.id ? currentPreset.id : ''}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="input h-8 text-sm"
                >
                  <option value="">선택...</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.nameKo} ({preset.width}x{preset.height})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background color */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          배경
        </h4>

        <div>
          <label className="label text-xs mb-1 block">배경색</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={canvas.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={canvas.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="input h-8 flex-1 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          빠른 선택
        </h4>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'instagram_feed_1_1', label: '인스타 피드' },
            { id: 'instagram_story', label: '인스타 스토리' },
            { id: 'kakao_channel_square', label: '카카오 채널' },
            { id: 'naver_shopping', label: '네이버 쇼핑' },
            { id: 'youtube_thumbnail', label: '유튜브 썸네일' },
            { id: 'facebook_post', label: '페이스북' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handlePresetChange(id)}
              className={`btn btn-sm text-xs py-2 rounded ${
                currentPreset?.id === id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
