'use client';

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlertTriangle,
} from 'lucide-react';
import type { TextLayer } from '@/lib/shared';
import { cn } from '@/lib/utils';

interface TextPropertiesProps {
  layer: TextLayer;
  onChange: (updates: Partial<TextLayer>) => void;
}

const FONT_FAMILIES = [
  { value: 'Pretendard', label: 'Pretendard' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
  { value: 'Spoqa Han Sans', label: 'Spoqa Han Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
];

const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'ExtraBold' },
];

export function TextProperties({ layer, onChange }: TextPropertiesProps) {
  return (
    <div className="p-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        텍스트
      </h4>

      {/* Overflow warning */}
      {layer.overflow && (
        <div className="flex items-center gap-2 p-2 mb-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>텍스트가 영역을 초과합니다</span>
        </div>
      )}

      {/* Brand lock warning */}
      {layer.brandLocked && (
        <div className="flex items-center gap-2 p-2 mb-3 bg-primary/10 border border-primary/20 rounded-md text-primary text-xs">
          <span>브랜드 잠금 - 편집 불가</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Text content */}
        <div>
          <label className="label text-xs mb-1 block">내용</label>
          <textarea
            value={layer.content}
            onChange={(e) => onChange({ content: e.target.value })}
            disabled={layer.brandLocked}
            className="input min-h-[80px] text-sm resize-y"
            placeholder="텍스트를 입력하세요"
          />
        </div>

        {/* Font family */}
        <div>
          <label className="label text-xs mb-1 block">글꼴</label>
          <select
            value={layer.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            disabled={layer.brandLocked}
            className="input h-9 text-sm"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font size & weight */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs mb-1 block">크기</label>
            <input
              type="number"
              value={layer.fontSize}
              onChange={(e) =>
                onChange({
                  fontSize: Math.max(6, Math.min(200, parseFloat(e.target.value) || 16)),
                })
              }
              disabled={layer.brandLocked}
              className="input h-8 text-sm"
              min={6}
              max={200}
            />
          </div>
          <div>
            <label className="label text-xs mb-1 block">두께</label>
            <select
              value={layer.fontWeight}
              onChange={(e) => onChange({ fontWeight: parseInt(e.target.value) })}
              disabled={layer.brandLocked}
              className="input h-8 text-sm"
            >
              {FONT_WEIGHTS.map((weight) => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="label text-xs mb-1 block">색상</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={layer.color}
              onChange={(e) => onChange({ color: e.target.value })}
              disabled={layer.brandLocked}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={layer.color}
              onChange={(e) => onChange({ color: e.target.value })}
              disabled={layer.brandLocked}
              className="input h-8 flex-1 text-sm font-mono"
            />
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="label text-xs mb-1 block">정렬</label>
          <div className="flex gap-1">
            {[
              { value: 'left' as const, icon: AlignLeft },
              { value: 'center' as const, icon: AlignCenter },
              { value: 'right' as const, icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onChange({ textAlign: value })}
                disabled={layer.brandLocked}
                className={cn(
                  'btn btn-sm p-2 rounded',
                  layer.textAlign === value ? 'bg-primary/10 text-primary' : 'btn-ghost'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Text decoration */}
        <div>
          <label className="label text-xs mb-1 block">스타일</label>
          <div className="flex gap-1">
            <button
              onClick={() =>
                onChange({ fontWeight: layer.fontWeight >= 600 ? 400 : 700 })
              }
              disabled={layer.brandLocked}
              className={cn(
                'btn btn-sm p-2 rounded',
                layer.fontWeight >= 600 ? 'bg-primary/10 text-primary' : 'btn-ghost'
              )}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onChange({
                  fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              disabled={layer.brandLocked}
              className={cn(
                'btn btn-sm p-2 rounded',
                layer.fontStyle === 'italic' ? 'bg-primary/10 text-primary' : 'btn-ghost'
              )}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onChange({
                  textDecoration:
                    layer.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              disabled={layer.brandLocked}
              className={cn(
                'btn btn-sm p-2 rounded',
                layer.textDecoration === 'underline'
                  ? 'bg-primary/10 text-primary'
                  : 'btn-ghost'
              )}
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onChange({
                  textDecoration:
                    layer.textDecoration === 'line-through' ? 'none' : 'line-through',
                })
              }
              disabled={layer.brandLocked}
              className={cn(
                'btn btn-sm p-2 rounded',
                layer.textDecoration === 'line-through'
                  ? 'bg-primary/10 text-primary'
                  : 'btn-ghost'
              )}
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Line height & letter spacing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs mb-1 block">줄 간격</label>
            <input
              type="number"
              value={layer.lineHeight}
              onChange={(e) =>
                onChange({
                  lineHeight: Math.max(0.5, Math.min(3, parseFloat(e.target.value) || 1.4)),
                })
              }
              disabled={layer.brandLocked}
              className="input h-8 text-sm"
              min={0.5}
              max={3}
              step={0.1}
            />
          </div>
          <div>
            <label className="label text-xs mb-1 block">자간</label>
            <input
              type="number"
              value={layer.letterSpacing}
              onChange={(e) =>
                onChange({ letterSpacing: parseFloat(e.target.value) || 0 })
              }
              disabled={layer.brandLocked}
              className="input h-8 text-sm"
              step={0.1}
            />
          </div>
        </div>

        {/* Auto-fit */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <label className="label text-xs">자동 맞춤</label>
            <p className="text-xs text-muted-foreground">
              텍스트가 영역에 맞게 크기 조절
            </p>
          </div>
          <input
            type="checkbox"
            checked={layer.autoFit}
            onChange={(e) => onChange({ autoFit: e.target.checked })}
            disabled={layer.brandLocked}
            className="rounded"
          />
        </div>

        {/* Auto-fit config */}
        {layer.autoFit && (
          <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
            <div>
              <label className="label text-xs mb-1 block">최소 크기</label>
              <input
                type="number"
                value={layer.autoFitConfig?.minFontSize ?? 12}
                onChange={(e) =>
                  onChange({
                    autoFitConfig: {
                      ...layer.autoFitConfig,
                      minFontSize: Math.max(6, parseInt(e.target.value) || 12),
                      maxFontSize: layer.autoFitConfig?.maxFontSize ?? 72,
                      strategy: layer.autoFitConfig?.strategy ?? 'shrink',
                    },
                  })
                }
                disabled={layer.brandLocked}
                className="input h-8 text-sm"
                min={6}
              />
            </div>
            <div>
              <label className="label text-xs mb-1 block">최대 크기</label>
              <input
                type="number"
                value={layer.autoFitConfig?.maxFontSize ?? 72}
                onChange={(e) =>
                  onChange({
                    autoFitConfig: {
                      ...layer.autoFitConfig,
                      minFontSize: layer.autoFitConfig?.minFontSize ?? 12,
                      maxFontSize: Math.min(200, parseInt(e.target.value) || 72),
                      strategy: layer.autoFitConfig?.strategy ?? 'shrink',
                    },
                  })
                }
                disabled={layer.brandLocked}
                className="input h-8 text-sm"
                max={200}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
