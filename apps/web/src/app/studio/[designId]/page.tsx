'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, Image as ImageIcon, Smartphone, Monitor, Maximize2, LayoutGrid } from 'lucide-react';
import { StudioProvider, useStudioActions, useStudio } from '@/contexts/studio-context';
import { StudioToolbar } from '@/components/studio/Toolbar/StudioToolbar';
import { AssetGeneratorPanel, type GeneratedAsset, type CampaignFormat } from '@/components/studio/AssetGenerator/AssetGeneratorPanel';
import { ResultsPanel } from '@/components/studio/ResultsPanel/ResultsPanel';
import { useStudioKeyboard } from '@/hooks/useStudioKeyboard';
import { cn } from '@/lib/utils';

// Dynamic import for StudioCanvas to prevent SSR issues with Konva
const StudioCanvas = dynamic(
  () => import('@/components/studio/Canvas/StudioCanvas').then((mod) => mod.StudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-zinc-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-xs font-medium">Loading canvas...</p>
        </div>
      </div>
    ),
  }
);
import { PropertyPanel } from '@/components/studio/PropertyPanel/PropertyPanel';
import { LayerPanel } from '@/components/studio/LayerPanel/LayerPanel';
import { BrandPanel } from '@/components/studio/BrandPanel/BrandPanel';
import { AssetPreviewOverlay } from '@/components/studio/AssetPreview/AssetPreviewOverlay';
import { ExportDialog } from '@/components/export/ExportDialog';
import { RatioSelector } from '@/components/studio/RatioSelector/RatioSelector';
import { FloatingToolbar } from '@/components/studio/FloatingToolbar/FloatingToolbar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { getLatestBrand } from '@/lib/brand-storage';
import { saveDesignsToHistory, type DesignHistoryEntry } from '@/lib/design-history';
import type { DesignJSON, TextLayer, BackgroundLayer } from '@/lib/shared';

const FORMAT_SIZES: Record<string, { width: number; height: number; label: string; icon: React.ReactNode }> = {
  feed: { width: 1080, height: 1080, label: 'Feed 1:1', icon: <ImageIcon className="w-3 h-3" /> },
  story: { width: 1080, height: 1920, label: 'Story 9:16', icon: <Smartphone className="w-3 h-3" /> },
  banner: { width: 1920, height: 1080, label: 'Banner 16:9', icon: <Monitor className="w-3 h-3" /> },
  custom: { width: 1080, height: 1080, label: 'Custom', icon: <Maximize2 className="w-3 h-3" /> },
};

// Demo design for testing
function createDemoDesign(): DesignJSON {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    meta: {
      id: crypto.randomUUID(),
      name: 'Campaign Asset',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    canvas: {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
    },
    layers: [
      {
        id: crypto.randomUUID(),
        name: 'Background',
        type: 'background',
        visible: true,
        locked: false,
        opacity: 1,
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1080 },
        backgroundColor: '#ffffff',
        backgroundFit: 'cover',
      },
      {
        id: crypto.randomUUID(),
        name: 'Headline',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 1,
        position: { x: 100, y: 100 },
        size: { width: 880, height: 120 },
        content: 'Lorem Ipsum Dolor',
        fontFamily: 'Pretendard',
        fontSize: 64,
        fontWeight: 700,
        fontStyle: 'normal',
        color: '#18181b',
        textAlign: 'center',
        verticalAlign: 'top',
        lineHeight: 1.2,
        letterSpacing: -1,
        textDecoration: 'none',
        autoFit: true,
        brandLocked: false,
        overflow: false,
      },
      {
        id: crypto.randomUUID(),
        name: 'Description',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 1,
        position: { x: 100, y: 250 },
        size: { width: 880, height: 100 },
        content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
        fontFamily: 'Pretendard',
        fontSize: 24,
        fontWeight: 400,
        fontStyle: 'normal',
        color: '#52525b',
        textAlign: 'center',
        verticalAlign: 'top',
        lineHeight: 1.5,
        letterSpacing: 0,
        textDecoration: 'none',
        autoFit: true,
        brandLocked: false,
        overflow: false,
      },
    ],
    brandLocks: [],
  };
}

function StudioContent() {
  const params = useParams();
  const designId = params.designId as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<import('konva').default.Stage>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [rightTab, setRightTab] = useState<'design' | 'layers' | 'brand'>('design');
  const [previewAsset, setPreviewAsset] = useState<GeneratedAsset | null>(null);
  const [campaignFormats, setCampaignFormats] = useState<CampaignFormat[]>([]);
  const [activeFormatTab, setActiveFormatTab] = useState<string>('all');

  const { loadDesign, updateCanvas, updateLayer, fitToCanvas } = useStudioActions();
  const storeDesign = useStudio((s) => s.design);
  const isLoading = useStudio((s) => s.isLoading);
  const error = useStudio((s) => s.error);
  const viewport = useStudio((s) => s.viewport);

  // Auto-save functionality
  const { save } = useAutoSave({
    onSave: async (id) => {
      console.log('Saving design:', id);
    },
    onError: (error) => {
      console.error('Save error:', error);
    },
  });

  // Keyboard shortcuts
  useStudioKeyboard({
    onSave: save,
    isPreviewMode,
    onExitPreview: () => setIsPreviewMode(false),
  });

  // Load design on mount, then apply brand DNA if available
  useEffect(() => {
    const design = createDemoDesign();

    // Check for brand DNA and apply to the design before loading
    let brandDna: { colors?: Record<string, string>; typography?: Record<string, string> } | null = null;
    try {
      const session = sessionStorage.getItem('brandDna');
      if (session) {
        brandDna = JSON.parse(session);
      }
    } catch { /* ignore */ }

    if (!brandDna) {
      const latest = getLatestBrand();
      if (latest) {
        brandDna = { colors: latest.colors as Record<string, string>, typography: latest.typography as Record<string, string> };
      }
    }

    if (brandDna) {
      const colors = brandDna.colors ?? {};
      const typo = brandDna.typography ?? {};

      // Apply brand background color
      if (colors.background) {
        design.canvas.backgroundColor = colors.background;
        const bgLayer = design.layers.find((l) => l.type === 'background');
        if (bgLayer && 'backgroundColor' in bgLayer) {
          (bgLayer as { backgroundColor: string }).backgroundColor = colors.background;
        }
      }

      // Apply brand text color to text layers
      const textColor = colors.text || colors.primary || '#18181b';
      for (const layer of design.layers) {
        if (layer.type === 'text' && 'color' in layer) {
          const tl = layer as TextLayer;
          if (tl.name === 'Headline') {
            tl.color = textColor;
          } else if (tl.name === 'Description') {
            tl.color = colors.secondary || textColor;
          }
        }
      }

      // Apply brand fonts
      const headingFont = typo.heading;
      const bodyFont = typo.body || typo.heading;
      if (headingFont || bodyFont) {
        for (const layer of design.layers) {
          if (layer.type === 'text' && 'fontFamily' in layer) {
            const tl = layer as TextLayer;
            if (tl.name === 'Headline') {
              if (headingFont) tl.fontFamily = headingFont;
            } else {
              if (bodyFont) tl.fontFamily = bodyFont;
            }
          }
        }
      }
    }

    loadDesign(design);
  }, [designId, loadDesign]);

  const handleExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    save();
  }, [save]);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
  }, []);

  const handleGenerationResults = useCallback((assets: GeneratedAsset[]) => {
    setGeneratedAssets((prev) => [...prev, ...assets]);
    setHasGeneratedResults(true);
    setIsGenerating(false);

    // Save to design history
    try {
      let brandId: string | null = null;
      let brandName: string | null = null;
      let brandColors: string[] = [];
      let prompt = '';
      let moods: string[] = [];
      let productName = '';

      try {
        const session = sessionStorage.getItem('brandDna');
        if (session) {
          const dna = JSON.parse(session);
          brandName = dna.brandName ?? null;
          const c = dna.colors ?? {};
          brandColors = [c.primary, c.secondary, c.accent, c.background, c.text].filter(Boolean);
        }
        brandId = sessionStorage.getItem('activeBrandId') ?? null;
        prompt = sessionStorage.getItem('assetPrompt') ?? '';
        const moodsRaw = sessionStorage.getItem('assetMoods');
        if (moodsRaw) moods = JSON.parse(moodsRaw);
        productName = sessionStorage.getItem('assetProductName') ?? '';
      } catch { /* ignore */ }

      const entries: DesignHistoryEntry[] = assets.map((asset) => ({
        id: asset.id,
        thumbnail: asset.image,
        format: asset.format,
        label: asset.label,
        brandId,
        brandName,
        brandColors,
        prompt,
        moods,
        productName,
        createdAt: new Date().toISOString(),
      }));
      saveDesignsToHistory(entries);
    } catch { /* don't block UI on history save failure */ }
  }, []);

  const togglePreview = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const captureCanvas = useCallback((): string | null => {
    if (!stageRef.current || !storeDesign) return null;
    try {
      const stage = stageRef.current;
      const { width, height } = storeDesign.canvas;

      // Temporarily reset viewport to capture clean canvas area
      const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
      const oldPos = { x: stage.x(), y: stage.y() };

      stage.scaleX(1);
      stage.scaleY(1);
      stage.x(0);
      stage.y(0);

      // Force a synchronous redraw so the capture reflects current state
      stage.batchDraw();

      const dataUrl = stage.toDataURL({ x: 0, y: 0, width, height, pixelRatio: 1 });

      // Restore original viewport
      stage.scaleX(oldScale.x);
      stage.scaleY(oldScale.y);
      stage.x(oldPos.x);
      stage.y(oldPos.y);

      return dataUrl;
    } catch {
      return null;
    }
  }, [storeDesign]);

  const handleFormatTabChange = useCallback((formatId: string) => {
    setActiveFormatTab(formatId);
    if (formatId === 'all' || !FORMAT_SIZES[formatId]) return;

    const { width, height } = FORMAT_SIZES[formatId];
    updateCanvas({ width, height });

    // Also update background layer to match
    if (storeDesign) {
      const bgLayer = storeDesign.layers.find((l) => l.type === 'background') as BackgroundLayer | undefined;
      if (bgLayer) {
        updateLayer(bgLayer.id, { size: { width, height } });
      }
    }

    // Re-fit canvas to container
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setTimeout(() => fitToCanvas(rect.width, rect.height), 50);
    }
  }, [updateCanvas, updateLayer, fitToCanvas, storeDesign, containerRef]);

  const handleShare = useCallback(async () => {
    if (!storeDesign || !stageRef.current) return;

    try {
      const { width, height } = storeDesign.canvas;
      const dataUrl = stageRef.current.toDataURL({
        x: 0, y: 0, width, height, pixelRatio: 2,
      });

      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${storeDesign.meta.name}.png`, { type: 'image/png' });

      // Use Web Share API if supported
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: storeDesign.meta.name,
          text: 'Created with Pink Spade',
          files: [file],
        });
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('Image copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [storeDesign]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-xs font-medium">Loading design...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen preview mode
  if (isPreviewMode) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-zinc-900 relative">
        {/* Close button */}
        <button
          onClick={() => setIsPreviewMode(false)}
          className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Exit Preview (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Zoom display */}
        <div className="absolute bottom-4 right-4 z-50 text-white/50 text-xs font-mono">
          {Math.round(viewport.zoom * 100)}%
        </div>
        {/* Canvas only */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden flex items-center justify-center relative"
        >
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <StudioCanvas containerRef={containerRef} stageRef={stageRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Toolbar */}
      <StudioToolbar onExport={handleExport} onSave={handleSave} onPreview={togglePreview} onShare={handleShare} />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar — Asset Generator */}
        <AssetGeneratorPanel onGenerate={handleGenerate} onResults={handleGenerationResults} isGenerating={isGenerating} onCaptureCanvas={captureCanvas} onFormatsChange={setCampaignFormats} />

        {/* Inner sidebar — Generated Results (shows selected channels even before generation) */}
        <ResultsPanel
          visible={campaignFormats.some((f) => f.checked) || hasGeneratedResults}
          generatedAssets={generatedAssets}
          selectedFormats={campaignFormats}
          onPreviewAsset={setPreviewAsset}
        />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Format tab bar — shows when formats are selected */}
          {campaignFormats.some((f) => f.checked) && (
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-200 bg-white flex-shrink-0">
              <button
                onClick={() => handleFormatTabChange('all')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                  activeFormatTab === 'all'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                <LayoutGrid className="w-3 h-3" />
                All
              </button>
              {campaignFormats.filter((f) => f.checked).map((fmt) => {
                const config = FORMAT_SIZES[fmt.id];
                if (!config) return null;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => handleFormatTabChange(fmt.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                      activeFormatTab === fmt.id
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                  >
                    {config.icon}
                    {config.label}
                    <span className={cn(
                      'text-[9px] font-mono',
                      activeFormatTab === fmt.id ? 'text-zinc-400' : 'text-zinc-400'
                    )}>
                      {config.width}×{config.height}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 bg-zinc-100 overflow-auto flex items-center justify-center relative"
          >
            {/* Ratio selector — top center */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
              <RatioSelector />
            </div>

            {/* Dot pattern background */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#18181b 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <StudioCanvas containerRef={containerRef} stageRef={stageRef} />

            {/* Floating toolbar on element selection */}
            <FloatingToolbar />

            {/* Loading animation overlay */}
            {isGenerating && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full bg-pink-100 animate-ping opacity-30" />
                    <div className="absolute inset-2 rounded-full bg-pink-50 animate-pulse" />
                    <img
                      src="/logo.png"
                      alt="Loading"
                      className="absolute inset-0 w-full h-full object-contain p-3 drop-shadow-sm spade-float"
                    />
                  </div>
                  <p className="text-xs font-medium text-zinc-500">Generating assets...</p>
                </div>
              </div>
            )}

            {/* Asset preview overlay */}
            {previewAsset && (
              <AssetPreviewOverlay asset={previewAsset} onClose={() => setPreviewAsset(null)} />
            )}
          </div>
        </div>

        {/* Right sidebar — Property Panel / Layer Panel */}
        <div className="w-[300px] border-l border-zinc-200 bg-white flex flex-col z-10 overflow-hidden">
          {/* Tab Header */}
          <div className="flex h-12 border-b border-zinc-200 flex-shrink-0">
            <button
              onClick={() => setRightTab('design')}
              className={cn(
                'flex-1 flex items-center justify-center text-xs font-medium transition-colors',
                rightTab === 'design'
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              Design
            </button>
            <button
              onClick={() => setRightTab('layers')}
              className={cn(
                'flex-1 flex items-center justify-center text-xs font-medium transition-colors',
                rightTab === 'layers'
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              Layers
            </button>
            <button
              onClick={() => setRightTab('brand')}
              className={cn(
                'flex-1 flex items-center justify-center text-xs font-medium transition-colors',
                rightTab === 'brand'
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              Brand
            </button>
          </div>
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'design' && <PropertyPanel />}
            {rightTab === 'layers' && <LayerPanel />}
            {rightTab === 'brand' && <BrandPanel />}
          </div>
        </div>
      </div>

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} stageRef={stageRef} generatedAssets={generatedAssets} />
    </div>
  );
}

export default function StudioPage() {
  return (
    <StudioProvider>
      <StudioContent />
    </StudioProvider>
  );
}
