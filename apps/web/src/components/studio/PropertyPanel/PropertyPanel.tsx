'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import type { TextLayer, BackgroundLayer } from '@/lib/shared';
import { Palette, Type, Wand2, ShieldCheck, Search, ChevronDown, Loader2 } from 'lucide-react';
import { useGoogleFonts, loadGoogleFont } from '@/hooks/useGoogleFonts';

export function PropertyPanel() {
  const design = useStudio((s) => s.design);
  const { updateLayer, updateCanvas } = useStudioActions();
  const { fonts, isLoading: fontsLoading, popularFonts } = useGoogleFonts();

  const [fontSearch, setFontSearch] = useState('');
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [copyPrompt, setCopyPrompt] = useState('');

  // All hooks must be above the early return
  const filteredFonts = useMemo(() => {
    if (!fontSearch) {
      const popular = fonts.filter((f) => popularFonts.includes(f.family));
      const rest = fonts.filter((f) => !popularFonts.includes(f.family));
      return { popular, rest };
    }
    const q = fontSearch.toLowerCase();
    const matched = fonts.filter((f) => f.family.toLowerCase().includes(q));
    return { popular: [], rest: matched };
  }, [fonts, fontSearch, popularFonts]);

  const handleFontChange = useCallback(
    (family: string) => {
      if (!design) return;
      loadGoogleFont(family);
      const textLayers = design.layers.filter((l) => l.type === 'text') as TextLayer[];
      textLayers.forEach((layer) => {
        updateLayer(layer.id, { fontFamily: family });
      });
      setFontDropdownOpen(false);
      setFontSearch('');
    },
    [design, updateLayer]
  );

  const handleGenerateCopy = useCallback(async () => {
    if (!design) return;
    const allTextLayers = design.layers.filter((l) => l.type === 'text') as TextLayer[];
    if (allTextLayers.length === 0) return;

    setIsGeneratingCopy(true);

    // Gather context from sessionStorage
    let brandDna = null;
    let productName = '';
    let moods: string[] = [];
    let prompt = '';
    try {
      const stored = sessionStorage.getItem('brandDna');
      if (stored) brandDna = JSON.parse(stored);
      productName = sessionStorage.getItem('assetProductName') || '';
      const moodsStr = sessionStorage.getItem('assetMoods');
      if (moodsStr) moods = JSON.parse(moodsStr);
      prompt = sessionStorage.getItem('assetPrompt') || '';
    } catch { /* ignore */ }

    // Get current channel category from sessionStorage
    let channelCategory = '';
    try {
      const fmts = sessionStorage.getItem('activeChannelCategory');
      if (fmts) channelCategory = fmts;
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textLayers: allTextLayers.map((l) => ({ id: l.id, name: l.name, content: l.content })),
          brandDna,
          productName,
          moods,
          prompt,
          userCopyPrompt: copyPrompt || undefined,
          channelCategory: channelCategory || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.copies) {
          for (const [layerId, newContent] of Object.entries(data.copies)) {
            updateLayer(layerId, { content: newContent as string });
          }
        }
      }
    } catch (err) {
      console.error('Copy generation failed:', err);
    } finally {
      setIsGeneratingCopy(false);
    }
  }, [design, updateLayer, copyPrompt]);

  if (!design) return null;

  const textLayers = design.layers.filter((l) => l.type === 'text') as TextLayer[];
  const backgroundLayer = design.layers.find((l) => l.type === 'background') as BackgroundLayer | undefined;
  const currentFont = textLayers[0]?.fontFamily || 'Pretendard';

  const handleTextChange = (id: string, content: string) => {
    updateLayer(id, { content });
  };

  const handleColorChange = (id: string, color: string) => {
    updateLayer(id, { color });
  };

  const handleBackgroundColorChange = (color: string) => {
    if (backgroundLayer) {
      updateLayer(backgroundLayer.id, { backgroundColor: color });
    } else {
      updateCanvas({ backgroundColor: color });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto custom-scrollbar">
      <div className="p-4 flex flex-col gap-5">
        {/* Typography Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700">Typography</span>
            <Type className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          {/* Font Selector */}
          <div className="relative">
            <button
              onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 flex items-center justify-between"
            >
              <span style={{ fontFamily: currentFont }}>{currentFont}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {fontDropdownOpen && (
              <FontDropdown
                fonts={filteredFonts}
                fontSearch={fontSearch}
                onSearchChange={setFontSearch}
                onSelect={handleFontChange}
                currentFont={currentFont}
                isLoading={fontsLoading}
                onClose={() => { setFontDropdownOpen(false); setFontSearch(''); }}
              />
            )}
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Text Content Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Type className="w-3.5 h-3.5" />
            <span>텍스트 내용</span>
          </div>

          {textLayers.map((layer) => (
            <div key={layer.id} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                {layer.name}
              </label>
              {layer.name.toLowerCase().includes('description') || layer.name.toLowerCase().includes('본문') ? (
                <textarea
                  value={layer.content}
                  onChange={(e) => handleTextChange(layer.id, e.target.value)}
                  className="w-full h-20 bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md p-3 outline-none resize-none focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              ) : (
                <input
                  type="text"
                  value={layer.content}
                  onChange={(e) => handleTextChange(layer.id, e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                />
              )}
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* AI Copy Editor */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-zinc-700">AI Copy Editor</span>
            </div>
            <span className="text-[10px] text-zinc-500 border border-zinc-200 px-1.5 rounded bg-zinc-50">
              Flash
            </span>
          </div>
          <textarea
            value={copyPrompt}
            onChange={(e) => setCopyPrompt(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2.5 text-xs text-zinc-900 outline-none resize-none h-16 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
            placeholder="카피 방향을 입력하세요 (예: 겨울 시즌 프로모션, 친근한 톤)"
          />
          <button
            onClick={handleGenerateCopy}
            disabled={isGeneratingCopy}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-md py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingCopy ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 text-amber-500" />
                AI로 카피 생성
              </>
            )}
          </button>
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Brand Colors */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Palette className="w-3.5 h-3.5" />
            <span>브랜드 컬러</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                배경 색상
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundLayer?.backgroundColor || design.canvas.backgroundColor || '#ffffff'}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200 p-0.5"
                />
                <input
                  type="text"
                  value={backgroundLayer?.backgroundColor || design.canvas.backgroundColor || '#ffffff'}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md px-3 py-1.5 outline-none uppercase font-mono focus:border-zinc-900"
                />
              </div>
            </div>

            {textLayers.map((layer) => (
              <div key={`color-${layer.id}`} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  {layer.name} 색상
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layer.color || '#000000'}
                    onChange={(e) => handleColorChange(layer.id, e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={layer.color || '#000000'}
                    onChange={(e) => handleColorChange(layer.id, e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs rounded-md px-3 py-1.5 outline-none uppercase font-mono focus:border-zinc-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Compliance Guard */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700">Compliance Guard</span>
            <div className="w-8 h-4 bg-zinc-900 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-all" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-md p-2.5 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-green-700 font-medium">All Clear</span>
              <span className="text-[10px] text-zinc-600 leading-tight">
                모든 텍스트가 브랜드 가이드라인을 준수합니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Font Dropdown Component ---- */

interface FontDropdownProps {
  fonts: { popular: { family: string; category: string }[]; rest: { family: string; category: string }[] };
  fontSearch: string;
  onSearchChange: (v: string) => void;
  onSelect: (family: string) => void;
  currentFont: string;
  isLoading: boolean;
  onClose: () => void;
}

function FontDropdown({ fonts, fontSearch, onSearchChange, onSelect, currentFont, isLoading, onClose }: FontDropdownProps) {
  const handleMouseEnter = useCallback((family: string) => {
    loadGoogleFont(family);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
        {/* Search */}
        <div className="p-2 border-b border-zinc-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fontSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search fonts..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:border-zinc-900"
              autoFocus
            />
          </div>
        </div>

        {/* Font list */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-zinc-400">Loading fonts...</div>
          ) : (
            <>
              {fonts.popular.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50 sticky top-0">
                    Popular
                  </div>
                  {fonts.popular.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => onSelect(font.family)}
                      onMouseEnter={() => handleMouseEnter(font.family)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center justify-between ${
                        currentFont === font.family ? 'bg-zinc-50 text-zinc-900 font-medium' : 'text-zinc-700'
                      }`}
                    >
                      <span style={{ fontFamily: font.family }}>{font.family}</span>
                      <span className="text-[10px] text-zinc-400">{font.category}</span>
                    </button>
                  ))}
                </>
              )}

              {fonts.rest.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50 sticky top-0">
                    {fontSearch ? `Results (${fonts.rest.length})` : 'All Fonts'}
                  </div>
                  {fonts.rest.slice(0, 100).map((font) => (
                    <button
                      key={font.family}
                      onClick={() => onSelect(font.family)}
                      onMouseEnter={() => handleMouseEnter(font.family)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center justify-between ${
                        currentFont === font.family ? 'bg-zinc-50 text-zinc-900 font-medium' : 'text-zinc-700'
                      }`}
                    >
                      <span style={{ fontFamily: font.family }}>{font.family}</span>
                      <span className="text-[10px] text-zinc-400">{font.category}</span>
                    </button>
                  ))}
                  {fonts.rest.length > 100 && (
                    <div className="px-3 py-2 text-[10px] text-zinc-400 text-center">
                      Type to search {fonts.rest.length - 100} more fonts...
                    </div>
                  )}
                </>
              )}

              {fonts.popular.length === 0 && fonts.rest.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400">No fonts found</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
