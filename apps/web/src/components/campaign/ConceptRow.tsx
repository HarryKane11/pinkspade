'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormatCard } from './FormatCard';
import type { CampaignAsset, CampaignFormat } from './CampaignWizard';

interface ConceptRowProps {
  label: string;
  assets: CampaignAsset[];
  formats: CampaignFormat[];
  editingAssetId: string | null;
  onAssetClick: (assetId: string) => void;
  onRegenerate: (assetId: string) => void;
  selected: boolean;
  onSelect: () => void;
}

export function ConceptRow({
  label,
  assets,
  formats,
  editingAssetId,
  onAssetClick,
  onRegenerate,
  selected,
  onSelect,
}: ConceptRowProps) {
  const checkedFormats = formats.filter((f) => f.checked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-2xl border-2 transition-all',
        selected ? 'border-zinc-900 bg-zinc-50/50' : 'border-zinc-100 hover:border-zinc-200',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onSelect}
          className="flex items-center gap-2"
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              selected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
            )}
          >
            {selected && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <span className="text-sm font-semibold text-zinc-700">{label}</span>
        </button>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(checkedFormats.length, 4)}, 1fr)`,
        }}
      >
        {checkedFormats.map((fmt) => {
          const asset = assets.find((a) => a.formatId === fmt.id);
          if (!asset) return null;
          return (
            <FormatCard
              key={asset.id}
              asset={asset}
              formatLabel={fmt.label}
              formatDimensions={`${fmt.width}×${fmt.height}`}
              formatLogo={fmt.logo}
              selected={editingAssetId === asset.id}
              onClick={() => onAssetClick(asset.id)}
              onRegenerate={() => onRegenerate(asset.id)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
