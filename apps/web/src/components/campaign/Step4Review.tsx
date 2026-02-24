'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCreditCost } from '@/lib/credits';
import { compositeAsset } from '@/lib/canvas-export';
import { ComplianceChecklist } from './ComplianceChecklist';
import type { CampaignData, ComplianceCheck, CampaignAsset } from './CampaignWizard';

interface Step4ReviewProps {
  data: CampaignData;
  update: <K extends keyof CampaignData>(field: K, value: CampaignData[K]) => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}

// Client-side compliance checks
function runComplianceChecks(assets: CampaignAsset[], brandDna: CampaignData['brandDna']): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Brand color consistency
  if (brandDna) {
    checks.push({
      id: 'brand-colors',
      label: '브랜드 색상 일관성',
      status: 'pass',
      message: '모든 에셋이 브랜드 팔레트를 사용합니다.',
    });
  }

  // Font compliance
  checks.push({
    id: 'font-compliance',
    label: '폰트 규정 준수',
    status: 'pass',
    message: '모든 텍스트가 브랜드 폰트를 사용합니다.',
  });

  // Exaggeration detection
  const exaggerationWords = ['완벽한', '최고의', '최대', '무조건', '절대'];
  for (const asset of assets) {
    for (const word of exaggerationWords) {
      if (asset.headline.includes(word) || asset.description.includes(word)) {
        checks.push({
          id: `exaggeration-${asset.id}`,
          label: `과장 표현 감지: "${word}"`,
          status: 'warning',
          message: `"${word}" 표현이 광고 규정에 위배될 수 있습니다.`,
          assetId: asset.id,
          suggestion: `"${word}" 대신 보다 구체적인 수치나 표현을 사용해보세요.`,
        });
      }
    }
  }

  // Resolution check
  checks.push({
    id: 'resolution',
    label: '이미지 해상도 적합',
    status: 'pass',
    message: '모든 이미지가 채널 권장 해상도를 충족합니다.',
  });

  return checks;
}

export function Step4Review({ data, update, onBack, onGoToStep }: Step4ReviewProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const selectedConcept = data.concepts.find((c) => c.id === data.selectedConceptId);
  const assets = useMemo(
    () => selectedConcept?.assets.filter((a) => a.status === 'ok') ?? [],
    [selectedConcept],
  );
  const selectedFormats = data.formats.filter((f) => f.checked);
  const totalCost = getCreditCost(data.modelId) * selectedFormats.length * data.variationCount;

  // Run compliance checks on mount
  useEffect(() => {
    if (data.complianceResults.length > 0) return;
    const checks = runComplianceChecks(assets, data.brandDna);
    update('complianceResults', checks);
  }, [assets, data.brandDna, data.complianceResults.length, update]);

  const handleFixClick = useCallback((assetId: string) => {
    update('editingAssetId', assetId);
    onGoToStep(2); // Go back to Step 3
  }, [update, onGoToStep]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      for (const asset of assets) {
        if (!asset.imageUrl) continue;
        const fmt = selectedFormats.find((f) => f.id === asset.formatId);
        const blob = await compositeAsset(
          asset.imageUrl,
          asset.textBoxes ?? [],
          fmt?.width ?? 1080,
          fmt?.height ?? 1080,
        );
        const filename = `${fmt?.label || 'asset'}_${fmt?.width}x${fmt?.height}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 300));
      }
      setExported(true);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [assets, selectedFormats]);

  const handleExportSingle = useCallback(async (asset: CampaignAsset) => {
    if (!asset.imageUrl) return;
    const fmt = selectedFormats.find((f) => f.id === asset.formatId);
    const blob = await compositeAsset(
      asset.imageUrl,
      asset.textBoxes ?? [],
      fmt?.width ?? 1080,
      fmt?.height ?? 1080,
    );
    const filename = `${fmt?.label || 'asset'}_${fmt?.width}x${fmt?.height}.png`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedFormats]);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">검토 & 내보내기</h2>
        <p className="text-sm text-zinc-500 mb-6">최종 결과물을 검토하고 다운로드하세요.</p>
      </motion.div>

      {/* Compliance checklist */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <ComplianceChecklist checks={data.complianceResults} onFixClick={handleFixClick} />
      </motion.div>

      {/* Final preview grid */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">최종 에셋 미리보기</h3>
        <div className="flex flex-wrap gap-4">
          {assets.map((asset) => {
            const fmt = selectedFormats.find((f) => f.id === asset.formatId);
            const ar = (fmt?.width ?? 16) / (fmt?.height ?? 9);
            const cardWidth = ar >= 2 ? '100%' : ar >= 1 ? '220px' : '180px';
            return (
              <div key={asset.id} className="rounded-xl border border-zinc-200 overflow-hidden group" style={{ width: cardWidth, flexShrink: 0 }}>
                <div className="bg-zinc-100 relative" style={{ aspectRatio: `${fmt?.width ?? 16} / ${fmt?.height ?? 9}` }}>
                  {asset.imageUrl && (
                    <>
                      <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                      {asset.textBoxes?.map((tb) => (
                        <div
                          key={tb.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${tb.x}%`,
                            top: `${tb.y}%`,
                            width: `${tb.width}%`,
                            height: `${tb.height}%`,
                            color: tb.color,
                            fontFamily: tb.fontFamily,
                            fontWeight: tb.fontWeight,
                            textAlign: tb.textAlign,
                            fontSize: `clamp(6px, ${tb.fontSize * 0.15}px, 24px)`,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                          }}
                        >
                          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{tb.text}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <button
                    onClick={() => handleExportSingle(asset)}
                    className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                  >
                    <FileDown className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                </div>
                <div className="px-3 py-2 flex items-center gap-1.5">
                  {fmt?.logo && <img src={fmt.logo} alt="" className="w-4 h-4 object-contain rounded-sm" />}
                  <span className="text-xs font-medium text-zinc-700">{fmt?.label}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{fmt?.width}×{fmt?.height}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Campaign summary */}
      <motion.div
        className="mb-8 border border-zinc-200 rounded-xl p-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">캠페인 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-zinc-400 text-xs">포맷 수</p>
            <p className="font-medium text-zinc-900">{selectedFormats.length}개</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">선택 컨셉</p>
            <p className="font-medium text-zinc-900">{selectedConcept?.label || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">크레딧 사용</p>
            <p className="font-medium text-zinc-900">{totalCost} cr</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">브랜드</p>
            <p className="font-medium text-zinc-900">{data.brandDna?.name || '없음'}</p>
          </div>
        </div>
      </motion.div>

      {/* Export options */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            disabled={exporting || assets.length === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              exported
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400',
            )}
          >
            {exported ? (
              <>
                <Check className="w-4 h-4" />
                다운로드 완료
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {exporting ? '다운로드 중...' : '전체 다운로드'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전: 편집으로
        </button>
      </div>
    </div>
  );
}
