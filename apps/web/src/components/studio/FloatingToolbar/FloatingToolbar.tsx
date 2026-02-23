'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import { getLatestBrand } from '@/lib/brand-storage';
import type { TextLayer, ShapeLayer } from '@/lib/shared';
import { Type, ChevronDown } from 'lucide-react';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';
import { cn } from '@/lib/utils';

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  palette?: string[];
}

interface BrandTypo {
  heading?: string;
  body?: string;
}

export function FloatingToolbar() {
  const design = useStudio((s) => s.design);
  const selection = useStudio((s) => s.selection);
  const viewport = useStudio((s) => s.viewport);
  const { updateLayer } = useStudioActions();

  const [brandColors, setBrandColors] = useState<BrandColors>({});
  const [brandFonts, setBrandFonts] = useState<BrandTypo>({});
  const [fontOpen, setFontOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Load brand data
  useEffect(() => {
    try {
      const session = sessionStorage.getItem('brandDna');
      if (session) {
        const dna = JSON.parse(session);
        setBrandColors(dna.colors ?? {});
        setBrandFonts(dna.typography ?? {});
        return;
      }
    } catch { /* ignore */ }

    getLatestBrand().then((latest) => {
      if (latest) {
        setBrandColors(latest.colors);
        setBrandFonts(latest.typography);
      }
    });
  }, []);

  // Close font dropdown on outside click
  useEffect(() => {
    if (!fontOpen) return;
    const handle = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [fontOpen]);

  if (!design || selection.selectedLayerIds.length !== 1) return null;

  const selectedId = selection.selectedLayerIds[0];
  const selectedLayer = design.layers.find((l) => l.id === selectedId);
  if (!selectedLayer) return null;

  const isText = selectedLayer.type === 'text';
  const isShape = selectedLayer.type === 'shape';
  if (!isText && !isShape) return null;

  // Calculate position: above the selected element, offset to the right
  const layerX = selectedLayer.position.x * viewport.zoom + viewport.offsetX;
  const layerY = selectedLayer.position.y * viewport.zoom + viewport.offsetY;

  // Position above the element
  const toolbarTop = Math.max(8, layerY - 48);
  const toolbarLeft = layerX;

  const currentColor = isText
    ? (selectedLayer as TextLayer).color
    : (selectedLayer as ShapeLayer).fill ?? '#000000';

  const currentFont = isText ? (selectedLayer as TextLayer).fontFamily : null;

  // Build color palette from brand (deduplicated)
  const paletteColors: string[] = [];
  const addUnique = (c: string | undefined) => { if (c && !paletteColors.includes(c)) paletteColors.push(c); };
  addUnique(brandColors.primary);
  addUnique(brandColors.secondary);
  addUnique(brandColors.accent);
  addUnique(brandColors.text);
  addUnique(brandColors.background);
  if (brandColors.palette) {
    for (const c of brandColors.palette.slice(0, 3)) {
      if (!paletteColors.includes(c)) paletteColors.push(c);
    }
  }
  // Add common defaults (deduplicated)
  const defaultColors = ['#18181b', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
  for (const c of defaultColors) {
    if (!paletteColors.includes(c)) paletteColors.push(c);
    if (paletteColors.length >= 10) break;
  }

  // Brand fonts
  const fontChoices: string[] = [];
  if (brandFonts.heading) fontChoices.push(brandFonts.heading);
  if (brandFonts.body && brandFonts.body !== brandFonts.heading) fontChoices.push(brandFonts.body);
  const defaultFonts = ['Pretendard', 'Inter', 'Noto Sans KR', 'Playfair Display', 'Roboto'];
  for (const f of defaultFonts) {
    if (!fontChoices.includes(f)) fontChoices.push(f);
    if (fontChoices.length >= 7) break;
  }

  const handleColorChange = (color: string) => {
    if (isText) {
      updateLayer(selectedId, { color });
    } else {
      updateLayer(selectedId, { fill: color });
    }
  };

  const handleFontChange = (family: string) => {
    loadGoogleFont(family);
    updateLayer(selectedId, { fontFamily: family });
    setFontOpen(false);
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-30 pointer-events-auto"
      style={{
        top: toolbarTop,
        left: toolbarLeft,
      }}
    >
      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-2 py-1.5 shadow-lg">
        {/* Color palette */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-200">
          {paletteColors.slice(0, 8).map((hex) => (
            <button
              key={hex}
              onClick={() => handleColorChange(hex)}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                currentColor === hex ? 'border-zinc-900 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
          {/* Custom color picker */}
          <div className="relative ml-0.5">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-5 h-5 rounded-full cursor-pointer border border-zinc-300 p-0"
              title="Custom color"
            />
          </div>
        </div>

        {/* Font selector (text layers only) */}
        {isText && currentFont && (
          <div className="relative pl-1">
            <button
              onClick={() => setFontOpen(!fontOpen)}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
            >
              <Type className="w-3 h-3 text-zinc-400" />
              <span className="max-w-[80px] truncate" style={{ fontFamily: currentFont }}>
                {currentFont}
              </span>
              <ChevronDown className={cn('w-3 h-3 text-zinc-400 transition-transform', fontOpen && 'rotate-180')} />
            </button>

            {fontOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50">
                {brandFonts.heading && (
                  <div className="px-2 py-1 text-[9px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50">
                    Brand Fonts
                  </div>
                )}
                {fontChoices.map((family, i) => (
                  <button
                    key={family}
                    onClick={() => handleFontChange(family)}
                    onMouseEnter={() => loadGoogleFont(family)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors flex items-center justify-between',
                      currentFont === family ? 'bg-zinc-50 text-zinc-900 font-medium' : 'text-zinc-700',
                      // Separator after brand fonts
                      i === (brandFonts.body && brandFonts.body !== brandFonts.heading ? 1 : brandFonts.heading ? 0 : -1) && 'border-b border-zinc-100'
                    )}
                  >
                    <span style={{ fontFamily: family }}>{family}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
