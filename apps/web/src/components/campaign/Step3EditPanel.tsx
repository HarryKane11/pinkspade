'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextBoxOverlay } from './TextBoxOverlay';
import type { CampaignAsset, CampaignData, TextBox } from './CampaignWizard';

interface Step3EditPanelProps {
  asset: CampaignAsset;
  brandColors: string[];
  formatWidth: number;
  formatHeight: number;
  scopeMode: CampaignData['scopeMode'];
  onScopeChange: (mode: CampaignData['scopeMode']) => void;
  onApply: (updates: Partial<CampaignAsset>) => void;
  onReset: () => void;
  onClose: () => void;
}

export function Step3EditPanel({
  asset,
  brandColors,
  formatWidth,
  formatHeight,
  scopeMode,
  onScopeChange,
  onApply,
  onReset,
  onClose,
}: Step3EditPanelProps) {
  const [headline, setHeadline] = useState(asset.headline);
  const [description, setDescription] = useState(asset.description);
  const [headlineColor, setHeadlineColor] = useState(asset.headlineColor);
  const [descriptionColor, setDescriptionColor] = useState(asset.descriptionColor);
  const [backgroundColor, setBackgroundColor] = useState(asset.backgroundColor);
  const [headlineFontSize, setHeadlineFontSize] = useState(asset.headlineFontSize);
  const [descriptionFontSize, setDescriptionFontSize] = useState(asset.descriptionFontSize);
  const [localTextBoxes, setLocalTextBoxes] = useState<TextBox[]>(asset.textBoxes ?? []);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);

  // Sync when asset changes
  useEffect(() => {
    setHeadline(asset.headline);
    setDescription(asset.description);
    setHeadlineColor(asset.headlineColor);
    setDescriptionColor(asset.descriptionColor);
    setBackgroundColor(asset.backgroundColor);
    setHeadlineFontSize(asset.headlineFontSize);
    setDescriptionFontSize(asset.descriptionFontSize);
    setLocalTextBoxes(asset.textBoxes ?? []);
    setSelectedTextBoxId(null);
  }, [asset]);

  // Sync headline/description text changes into textBoxes
  useEffect(() => {
    setLocalTextBoxes((prev) =>
      prev.map((tb) => {
        if (tb.type === 'headline') return { ...tb, text: headline, color: headlineColor, fontSize: headlineFontSize };
        if (tb.type === 'description') return { ...tb, text: description, color: descriptionColor, fontSize: descriptionFontSize };
        return tb;
      }),
    );
  }, [headline, description, headlineColor, descriptionColor, headlineFontSize, descriptionFontSize]);

  const handleTextBoxChange = useCallback((updated: TextBox) => {
    setLocalTextBoxes((prev) => prev.map((tb) => (tb.id === updated.id ? updated : tb)));
  }, []);

  const selectedTb = localTextBoxes.find((tb) => tb.id === selectedTextBoxId) ?? null;

  const handlePositionChange = useCallback(
    (field: 'x' | 'y' | 'width' | 'height', value: number) => {
      if (!selectedTb) return;
      handleTextBoxChange({ ...selectedTb, [field]: value });
    },
    [selectedTb, handleTextBoxChange],
  );

  const handleApply = () => {
    onApply({
      headline,
      description,
      headlineColor,
      descriptionColor,
      backgroundColor,
      headlineFontSize,
      descriptionFontSize,
      textBoxes: localTextBoxes,
    });
  };

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-[360px] border-l border-zinc-200 bg-white flex flex-col h-full overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">에셋 편집</h3>
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* WYSIWYG Preview */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div
          className="relative w-full rounded-lg overflow-hidden bg-zinc-100"
          style={{ aspectRatio: `${formatWidth} / ${formatHeight}` }}
        >
          {asset.imageUrl && (
            <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
          )}
          <TextBoxOverlay
            textBoxes={localTextBoxes}
            selectedId={selectedTextBoxId}
            onSelect={setSelectedTextBoxId}
            onChange={handleTextBoxChange}
            formatWidth={formatWidth}
            formatHeight={formatHeight}
          />
        </div>
      </div>

      {/* Scope toggle */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <label className="text-xs font-medium text-zinc-500 block mb-2">적용 범위</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onScopeChange('all')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
              scopeMode === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            전체 포맷
          </button>
          <button
            onClick={() => onScopeChange('this')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
              scopeMode === 'this' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            이 포맷만
          </button>
        </div>
      </div>

      {/* Edit fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Text */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">텍스트</h4>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">헤드라인</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">색상</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">텍스트</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headlineColor}
                  onChange={(e) => setHeadlineColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 font-mono">{headlineColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">배경</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 font-mono">{backgroundColor}</span>
              </div>
            </div>
          </div>
          {/* Brand color swatches */}
          {brandColors.length > 0 && (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">브랜드 컬러</label>
              <div className="flex gap-1.5">
                {brandColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setHeadlineColor(c)}
                    className="w-7 h-7 rounded-md border border-zinc-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">타이포그래피</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">헤드라인 크기</label>
              <input
                type="number"
                value={headlineFontSize}
                onChange={(e) => setHeadlineFontSize(Number(e.target.value))}
                min={12}
                max={120}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">설명 크기</label>
              <input
                type="number"
                value={descriptionFontSize}
                onChange={(e) => setDescriptionFontSize(Number(e.target.value))}
                min={10}
                max={72}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Position controls for selected text box */}
        {selectedTb && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              위치 — {selectedTb.type === 'headline' ? '헤드라인' : '설명'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">X (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedTb.x)}
                  min={0}
                  max={100}
                  onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Y (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedTb.y)}
                  min={0}
                  max={100}
                  onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">너비 (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedTb.width)}
                  min={10}
                  max={100}
                  onChange={(e) => handlePositionChange('width', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">높이 (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedTb.height)}
                  min={5}
                  max={100}
                  onChange={(e) => handlePositionChange('height', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-zinc-100 flex items-center gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          적용
        </button>
      </div>
    </motion.div>
  );
}
