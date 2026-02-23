'use client';

import { Image as ImageIcon, Smartphone, Monitor, Maximize2, ChevronRight } from 'lucide-react';
import type { GeneratedAsset } from '../AssetGenerator/AssetGeneratorPanel';

interface SelectedFormat {
  id: string;
  label: string;
  checked: boolean;
}

interface ResultsPanelProps {
  visible: boolean;
  generatedAssets?: GeneratedAsset[];
  selectedFormats?: SelectedFormat[];
  onPreviewAsset?: (asset: GeneratedAsset) => void;
}

const FORMAT_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  feed: { label: 'Instagram Feed', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  story: { label: 'Stories (9:16)', icon: <Smartphone className="w-3.5 h-3.5" /> },
  banner: { label: 'Banner (16:9)', icon: <Monitor className="w-3.5 h-3.5" /> },
  custom: { label: 'Custom', icon: <Maximize2 className="w-3.5 h-3.5" /> },
};

export function ResultsPanel({ visible, generatedAssets, selectedFormats, onPreviewAsset }: ResultsPanelProps) {
  if (!visible) return null;

  // Build display: show all selected formats, with their generated assets (or 0)
  const activeFormats = selectedFormats?.filter((f) => f.checked) ?? [];
  const assetsByFormat: Record<string, GeneratedAsset[]> = {};
  generatedAssets?.forEach((a) => {
    if (!assetsByFormat[a.format]) assetsByFormat[a.format] = [];
    assetsByFormat[a.format].push(a);
  });

  // If no selected formats and no assets, nothing to show
  if (activeFormats.length === 0 && (!generatedAssets || generatedAssets.length === 0)) return null;

  // Use active formats as the base; include any extra formats from generated assets
  const displayFormats = activeFormats.length > 0
    ? activeFormats.map((f) => f.id)
    : [...new Set(generatedAssets?.map((a) => a.format) ?? [])];

  const totalItems = generatedAssets?.length ?? 0;

  return (
    <aside className="w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col flex-shrink-0 z-0 overflow-hidden hidden md:flex">
      <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-white/50">
        <span className="text-xs font-medium text-zinc-900">Generated Results</span>
        <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm font-medium">
          {totalItems}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {displayFormats.map((formatId) => {
          const config = FORMAT_CONFIG[formatId] ?? FORMAT_CONFIG.custom;
          const assets = assetsByFormat[formatId] ?? [];
          const count = assets.length;

          return (
            <details key={formatId} className="group" open={count > 0}>
              <summary className="flex items-center justify-between px-2 py-2 hover:bg-zinc-200/50 rounded-md cursor-pointer transition-colors text-xs font-medium text-zinc-700">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${count > 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                    {config.icon}
                  </div>
                  <span className={count > 0 ? 'text-zinc-900' : 'text-zinc-500'}>{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    count > 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                  {count > 0 && <ChevronRight className="w-3 h-3 text-zinc-400 arrow-icon transition-transform" />}
                </div>
              </summary>

              {count > 0 && (
                <div className="mt-1 pl-8 pr-2 flex flex-col gap-1 pb-2">
                  {assets.map((asset, i) => (
                    <div
                      key={asset.id}
                      onClick={() => onPreviewAsset?.(asset)}
                      className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-white hover:border-zinc-200 hover:shadow-sm border border-transparent transition-all group"
                    >
                      <div className="w-8 h-8 bg-zinc-200 rounded overflow-hidden relative flex-shrink-0 group-hover:ring-2 group-hover:ring-zinc-900/10 transition-shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.image} className="w-full h-full object-cover" alt={`Version ${i + 1}`} />
                      </div>
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-900 truncate transition-colors">
                        Version {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {count === 0 && (
                <div className="mt-1 pl-8 pr-2 pb-2">
                  <p className="text-[10px] text-zinc-400">No results yet</p>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </aside>
  );
}
