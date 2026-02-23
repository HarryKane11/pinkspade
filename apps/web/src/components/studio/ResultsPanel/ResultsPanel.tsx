'use client';

import Image from 'next/image';
import { Image as ImageIcon, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import type { GeneratedAsset } from '../AssetGenerator/AssetGeneratorPanel';

interface ResultItem {
  id: string;
  name: string;
  thumbnail: string;
  active?: boolean;
  isBase64?: boolean;
}

interface ResultCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  items: ResultItem[];
}

interface ResultsPanelProps {
  visible: boolean;
  categories?: ResultCategory[];
  generatedAssets?: GeneratedAsset[];
  onPreviewAsset?: (asset: GeneratedAsset) => void;
}

const FORMAT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  feed: { label: 'Instagram Feed', icon: <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> },
  story: { label: 'Stories (9:16)', icon: <Smartphone className="w-3.5 h-3.5 text-zinc-400" /> },
  banner: { label: 'Banner (16:9)', icon: <Monitor className="w-3.5 h-3.5 text-zinc-400" /> },
  custom: { label: 'Custom', icon: <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> },
};

function buildCategoriesFromAssets(assets: GeneratedAsset[]): ResultCategory[] {
  const grouped: Record<string, GeneratedAsset[]> = {};
  assets.forEach((a) => {
    if (!grouped[a.format]) grouped[a.format] = [];
    grouped[a.format].push(a);
  });

  return Object.entries(grouped).map(([format, items]) => {
    const config = FORMAT_LABELS[format] ?? FORMAT_LABELS.custom;
    return {
      id: format,
      label: config.label,
      icon: config.icon,
      count: items.length,
      items: items.map((item, i) => ({
        id: item.id,
        name: `Version ${i + 1}`,
        thumbnail: item.image,
        active: i === 0,
        isBase64: true,
      })),
    };
  });
}

export function ResultsPanel({ visible, categories, generatedAssets, onPreviewAsset }: ResultsPanelProps) {
  if (!visible) return null;

  const displayCategories = generatedAssets && generatedAssets.length > 0
    ? buildCategoriesFromAssets(generatedAssets)
    : categories ?? [];

  if (displayCategories.length === 0) return null;

  const totalItems = displayCategories.reduce((sum, c) => sum + c.count, 0);

  return (
    <aside className="w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col flex-shrink-0 z-0 overflow-hidden hidden md:flex">
      <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-white/50">
        <span className="text-xs font-medium text-zinc-900">Generated Results</span>
        <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm font-medium">
          {totalItems}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {displayCategories.map((category) => (
          <details key={category.id} className="group" open>
            <summary className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-200/50 rounded-md cursor-pointer transition-colors text-xs font-medium text-zinc-700">
              <div className="flex items-center gap-2">
                {category.icon}
                {category.label}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">{category.count} items</span>
                <ChevronRight className="w-3 h-3 text-zinc-400 arrow-icon transition-transform" />
              </div>
            </summary>
            <div className="mt-1 pl-6 pr-2 flex flex-col gap-1 pb-2">
              {category.items.map((item) => {
                // Find original asset for preview callback
                const originalAsset = generatedAssets?.find((a) => a.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => originalAsset && onPreviewAsset?.(originalAsset)}
                    className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-white hover:border-zinc-200 hover:shadow-sm border border-transparent transition-all group"
                  >
                    <div className="w-8 h-8 bg-zinc-200 rounded overflow-hidden relative flex-shrink-0 group-hover:ring-2 group-hover:ring-zinc-900/10 transition-shadow">
                      {item.isBase64 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.name} />
                      ) : (
                        <Image src={item.thumbnail} fill className="object-cover" alt={item.name} sizes="32px" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-600 group-hover:text-zinc-900 truncate transition-colors">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}
