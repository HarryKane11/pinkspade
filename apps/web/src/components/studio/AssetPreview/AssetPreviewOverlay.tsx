'use client';

import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import type { GeneratedAsset } from '../AssetGenerator/AssetGeneratorPanel';

interface AssetPreviewOverlayProps {
  asset: GeneratedAsset;
  onClose: () => void;
}

export function AssetPreviewOverlay({ asset, onClose }: AssetPreviewOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = asset.image;
    a.download = `${asset.label || asset.format}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [asset]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-[80%] max-h-[80%]">
        {/* Format label */}
        <div className="mb-3 px-3 py-1 bg-zinc-900 text-white text-xs font-medium rounded-full">
          {asset.label}
        </div>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.image}
          alt={asset.label}
          className="max-w-full max-h-[calc(80vh-80px)] object-contain rounded-lg shadow-2xl border border-zinc-200"
        />

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
