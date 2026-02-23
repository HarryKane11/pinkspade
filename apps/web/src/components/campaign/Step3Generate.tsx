'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConceptRow } from './ConceptRow';
import { Step3EditPanel } from './Step3EditPanel';
import type { CampaignData, CampaignAsset, Concept } from './CampaignWizard';

interface Step3GenerateProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CONCEPT_LABELS = ['컨셉 A', '컨셉 B', '컨셉 C', '컨셉 D', '컨셉 E', '컨셉 F'];

export function Step3Generate({ data, update, onNext, onBack }: Step3GenerateProps) {
  const hasGenerated = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedFormats = data.formats.filter((f) => f.checked);
  const editingAsset = data.editingAssetId
    ? data.concepts.flatMap((c) => c.assets).find((a) => a.id === data.editingAssetId) || null
    : null;

  const brandColors: string[] = (() => {
    if (!data.brandDna) return [];
    const c = (data.brandDna as any).colors || {};
    return [c.primary, c.secondary, c.accent, c.background, c.text].filter(Boolean);
  })();

  // Generate assets on mount (once)
  const generateAll = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const concepts: Concept[] = [];
    for (let v = 0; v < data.variationCount; v++) {
      const conceptId = crypto.randomUUID();
      const assets: CampaignAsset[] = selectedFormats.map((fmt) => ({
        id: crypto.randomUUID(),
        conceptId,
        formatId: fmt.id,
        imageUrl: '',
        headline: data.headline,
        description: data.description,
        headlineFontSize: 48,
        headlineFontFamily: (data.brandDna as any)?.typography?.heading || (data.brandDna as any)?.typography?.headingFont || 'Pretendard',
        headlineColor: (data.brandDna as any)?.colors?.text || '#ffffff',
        descriptionFontSize: 24,
        descriptionFontFamily: (data.brandDna as any)?.typography?.body || (data.brandDna as any)?.typography?.bodyFont || 'Pretendard',
        descriptionColor: (data.brandDna as any)?.colors?.text || '#ffffff',
        backgroundColor: (data.brandDna as any)?.colors?.background || '#1a1a2e',
        status: 'loading',
      }));
      concepts.push({ id: conceptId, label: CONCEPT_LABELS[v] || `컨셉 ${v + 1}`, assets });
    }

    update('concepts', concepts);
    if (!data.selectedConceptId && concepts.length > 0) {
      update('selectedConceptId', concepts[0].id);
    }

    // Fire API calls in parallel per concept per format
    const updatedConcepts = [...concepts];
    const promises: Promise<void>[] = [];

    for (let ci = 0; ci < updatedConcepts.length; ci++) {
      for (let ai = 0; ai < updatedConcepts[ci].assets.length; ai++) {
        const asset = updatedConcepts[ci].assets[ai];
        const fmt = selectedFormats.find((f) => f.id === asset.formatId);
        if (!fmt) continue;

        const moodLabels = data.moods;
        const brandDna = data.brandDna
          ? {
              colors: (data.brandDna as any).colors,
              tone: (data.brandDna as any).tone ? { keywords: (data.brandDna as any).tone.keywords } : undefined,
            }
          : undefined;

        const body: Record<string, unknown> = {
          prompt: `${data.prompt}. Headline: "${data.headline}". Description: "${data.description}". Mood: ${moodLabels.join(', ')}. Variation ${ci + 1}.`,
          modelId: data.modelId,
          width: fmt.width,
          height: fmt.height,
          numImages: 1,
          brandDna,
        };
        if (data.productImage) {
          body.productImageBase64 = data.productImage;
        }

        const p = fetch('/api/media/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error('Generation failed');
            const result = await res.json();
            const imageUrl = result.images?.[0]?.url || '';
            updatedConcepts[ci] = {
              ...updatedConcepts[ci],
              assets: updatedConcepts[ci].assets.map((a) =>
                a.id === asset.id ? { ...a, imageUrl, status: 'ok' as const } : a,
              ),
            };
            update('concepts', [...updatedConcepts]);
          })
          .catch(() => {
            updatedConcepts[ci] = {
              ...updatedConcepts[ci],
              assets: updatedConcepts[ci].assets.map((a) =>
                a.id === asset.id ? { ...a, status: 'error' as const, statusMessage: '생성 실패' } : a,
              ),
            };
            update('concepts', [...updatedConcepts]);
          });

        promises.push(p);
      }
    }

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }, [data, selectedFormats, update, isGenerating]);

  useEffect(() => {
    if (!hasGenerated.current && data.concepts.length === 0) {
      hasGenerated.current = true;
      generateAll();
    }
  }, [generateAll, data.concepts.length]);

  const handleAssetClick = useCallback((assetId: string) => {
    update('editingAssetId', data.editingAssetId === assetId ? null : assetId);
  }, [data.editingAssetId, update]);

  const handleSelectConcept = useCallback((conceptId: string) => {
    update('selectedConceptId', conceptId);
  }, [update]);

  const handleRegenerate = useCallback(async (assetId: string) => {
    const asset = data.concepts.flatMap((c) => c.assets).find((a) => a.id === assetId);
    if (!asset) return;
    const fmt = selectedFormats.find((f) => f.id === asset.formatId);
    if (!fmt) return;

    // Set loading state
    const updated = data.concepts.map((c) => ({
      ...c,
      assets: c.assets.map((a) => a.id === assetId ? { ...a, status: 'loading' as const } : a),
    }));
    update('concepts', updated);

    try {
      const body: Record<string, unknown> = {
        prompt: `${data.prompt}. Headline: "${asset.headline}". Description: "${asset.description}".`,
        modelId: data.modelId,
        width: fmt.width,
        height: fmt.height,
        numImages: 1,
      };
      if (data.productImage) body.productImageBase64 = data.productImage;

      const res = await fetch('/api/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      const imageUrl = result.images?.[0]?.url || '';

      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === assetId ? { ...a, imageUrl, status: 'ok' as const } : a),
      })));
    } catch {
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === assetId ? { ...a, status: 'error' as const } : a),
      })));
    }
  }, [data, selectedFormats, update]);

  const handleApplyEdit = useCallback((updates: Partial<CampaignAsset>) => {
    if (!data.editingAssetId) return;
    const editingAssetObj = data.concepts.flatMap((c) => c.assets).find((a) => a.id === data.editingAssetId);
    if (!editingAssetObj) return;

    if (data.scopeMode === 'all') {
      // Apply to all assets in the same concept
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) =>
          a.conceptId === editingAssetObj.conceptId ? { ...a, ...updates } : a,
        ),
      })));
    } else {
      // Apply to this asset only
      update('concepts', data.concepts.map((c) => ({
        ...c,
        assets: c.assets.map((a) => a.id === data.editingAssetId ? { ...a, ...updates } : a),
      })));
    }
  }, [data, update]);

  const handleResetEdit = useCallback(() => {
    if (!data.editingAssetId) return;
    handleApplyEdit({
      headline: data.headline,
      description: data.description,
      headlineColor: (data.brandDna as any)?.colors?.text || '#ffffff',
      descriptionColor: (data.brandDna as any)?.colors?.text || '#ffffff',
      backgroundColor: (data.brandDna as any)?.colors?.background || '#1a1a2e',
      headlineFontSize: 48,
      descriptionFontSize: 24,
    });
  }, [data, handleApplyEdit]);

  return (
    <div className="flex h-full -mx-6 -my-8">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-1">생성 결과</h2>
                <p className="text-sm text-zinc-500">
                  컨셉을 선택하고, 개별 에셋을 클릭하여 편집하세요.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Scope toggle */}
                <div className="flex items-center gap-1.5 bg-zinc-100 rounded-lg p-0.5">
                  <span className="text-xs text-zinc-500 px-2">적용 범위:</span>
                  <button
                    onClick={() => update('scopeMode', 'all')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all',
                      data.scopeMode === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500',
                    )}
                  >
                    전체 포맷
                  </button>
                  <button
                    onClick={() => update('scopeMode', 'this')}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all',
                      data.scopeMode === 'this' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500',
                    )}
                  >
                    이 포맷만
                  </button>
                </div>

                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 생성
                </button>
              </div>
            </div>
          </motion.div>

          {/* Concept rows */}
          <div className="space-y-4">
            {data.concepts.map((concept) => (
              <ConceptRow
                key={concept.id}
                label={concept.label}
                assets={concept.assets}
                formats={data.formats}
                editingAssetId={data.editingAssetId}
                onAssetClick={handleAssetClick}
                onRegenerate={handleRegenerate}
                selected={data.selectedConceptId === concept.id}
                onSelect={() => handleSelectConcept(concept.id)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
            <button
              onClick={onNext}
              disabled={!data.selectedConceptId || isGenerating}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                data.selectedConceptId && !isGenerating
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed',
              )}
            >
              검토하기 →
            </button>
          </div>
        </div>
      </div>

      {/* Edit panel (slide-in) */}
      <AnimatePresence>
        {editingAsset && (
          <Step3EditPanel
            asset={editingAsset}
            brandColors={brandColors}
            scopeMode={data.scopeMode}
            onScopeChange={(mode) => update('scopeMode', mode)}
            onApply={handleApplyEdit}
            onReset={handleResetEdit}
            onClose={() => update('editingAssetId', null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
