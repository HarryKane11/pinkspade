'use client';

import { useEffect, useCallback, useState, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { X, Download, Crop, Move } from 'lucide-react';
import type { GeneratedAsset, CampaignFormat } from '../AssetGenerator/AssetGeneratorPanel';

interface AssetPreviewOverlayProps {
  asset: GeneratedAsset;
  onClose: () => void;
  formats?: CampaignFormat[];
}

export function AssetPreviewOverlay({ asset, onClose, formats }: AssetPreviewOverlayProps) {
  // Find the matching format for this asset
  const matchedFormat = formats?.find(
    (f) => f.id === asset.format || f.channelId === asset.format || f.label === asset.label
  );
  const targetW = matchedFormat?.width ?? 0;
  const targetH = matchedFormat?.height ?? 0;
  const hasFormat = targetW > 0 && targetH > 0;

  // Image natural dimensions
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 400, h: 400 });

  // Crop position (percentage of image: 0-1)
  const [cropPos, setCropPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; cx: number; cy: number }>({ x: 0, y: 0, cx: 0, cy: 0 });

  // Keyboard
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

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = asset.image;
  }, [asset.image]);

  // Measure crop container
  useEffect(() => {
    if (!cropContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(cropContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute crop rect in display coordinates
  const getCropDisplayRect = useCallback(() => {
    if (!imgSize || !hasFormat) return null;

    const imgAspect = imgSize.w / imgSize.h;
    const targetAspect = targetW / targetH;

    // How the image is displayed (object-contain) in the container
    let displayW: number, displayH: number;
    if (imgAspect > containerSize.w / containerSize.h) {
      displayW = containerSize.w;
      displayH = containerSize.w / imgAspect;
    } else {
      displayH = containerSize.h;
      displayW = containerSize.h * imgAspect;
    }
    const offsetX = (containerSize.w - displayW) / 2;
    const offsetY = (containerSize.h - displayH) / 2;

    // Crop rect size (relative to image) — fit target aspect ratio within image
    let cropW: number, cropH: number;
    if (targetAspect > imgAspect) {
      // Target is wider → crop full width, less height
      cropW = 1;
      cropH = (imgSize.w / targetAspect) / imgSize.h;
    } else {
      // Target is taller → crop full height, less width
      cropH = 1;
      cropW = (imgSize.h * targetAspect) / imgSize.w;
    }

    // Clamp position
    const maxX = 1 - cropW;
    const maxY = 1 - cropH;
    const cx = Math.max(0, Math.min(maxX, cropPos.x));
    const cy = Math.max(0, Math.min(maxY, cropPos.y));

    return {
      // Display pixel coordinates
      x: offsetX + cx * displayW,
      y: offsetY + cy * displayH,
      w: cropW * displayW,
      h: cropH * displayH,
      // Normalized (0-1) for crop export
      nx: cx,
      ny: cy,
      nw: cropW,
      nh: cropH,
      // Image display bounds
      displayX: offsetX,
      displayY: offsetY,
      displayW,
      displayH,
    };
  }, [imgSize, hasFormat, targetW, targetH, containerSize, cropPos]);

  const cropRect = getCropDisplayRect();

  // Drag handlers
  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!cropRect || !imgSize) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, cx: cropPos.x, cy: cropPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropRect, imgSize, cropPos]);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !cropRect || !imgSize) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Convert pixel delta to normalized delta
    const ndx = dx / cropRect.displayW;
    const ndy = dy / cropRect.displayH;

    const imgAspect = imgSize.w / imgSize.h;
    const targetAspect = targetW / targetH;
    let cropW: number, cropH: number;
    if (targetAspect > imgAspect) {
      cropW = 1;
      cropH = (imgSize.w / targetAspect) / imgSize.h;
    } else {
      cropH = 1;
      cropW = (imgSize.h * targetAspect) / imgSize.w;
    }

    setCropPos({
      x: Math.max(0, Math.min(1 - cropW, dragStart.current.cx + ndx)),
      y: Math.max(0, Math.min(1 - cropH, dragStart.current.cy + ndy)),
    });
  }, [isDragging, cropRect, imgSize, targetW, targetH]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Download original
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = asset.image;
    a.download = `${asset.label || asset.format}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [asset]);

  // Download cropped
  const handleDownloadCropped = useCallback(() => {
    if (!imgSize || !cropRect) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;

      // Source rect in natural image pixels
      const sx = cropRect.nx * imgSize.w;
      const sy = cropRect.ny * imgSize.h;
      const sw = cropRect.nw * imgSize.w;
      const sh = cropRect.nh * imgSize.h;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${asset.label || asset.format}-cropped-${targetW}x${targetH}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = asset.image;
  }, [imgSize, cropRect, targetW, targetH, asset]);

  // Simple layout when no format dimensions available
  if (!hasFormat) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 flex flex-col items-center max-w-[80%] max-h-[80%]">
          <div className="mb-3 px-3 py-1 bg-zinc-900 text-white text-xs font-medium rounded-full">
            {asset.label}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.image}
            alt={asset.label}
            className="max-w-full max-h-[calc(80vh-80px)] object-contain rounded-lg shadow-2xl border border-zinc-200"
          />
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-40 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Side-by-side container */}
      <div className="relative z-10 flex gap-4 p-6 max-w-[92%] max-h-[90vh] w-full">
        {/* Left: Full generated image */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="px-2.5 py-0.5 bg-white/10 text-white text-[10px] font-medium rounded-full">
              Generated Image
            </div>
            <div className="px-2.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded-full">
              {asset.label}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.image}
              alt={asset.label}
              className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg shadow-2xl"
            />
          </div>
          <button
            onClick={handleDownload}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-medium rounded-full hover:bg-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Original
          </button>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/10 self-stretch" />

        {/* Right: Crop tool */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="px-2.5 py-0.5 bg-white/10 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
              <Crop className="w-3 h-3" />
              Channel Crop
            </div>
            <div className="px-2.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded-full">
              {targetW}×{targetH}
            </div>
          </div>

          {/* Crop canvas */}
          <div
            ref={cropContainerRef}
            className="flex-1 relative w-full min-h-0 flex items-center justify-center select-none"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Image with dark overlay */}
            <div className="relative inline-block max-w-full max-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.image}
                alt=""
                className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg"
                style={{ display: 'block' }}
              />

              {/* Dark overlay with crop cutout */}
              {cropRect && (
                <svg
                  className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
                  viewBox={`0 0 ${containerSize.w} ${containerSize.h}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={cropRect.x}
                        y={cropRect.y}
                        width={cropRect.w}
                        height={cropRect.h}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.6)"
                    mask="url(#crop-mask)"
                  />
                </svg>
              )}

              {/* Draggable crop handle */}
              {cropRect && (
                <div
                  className="absolute border-2 border-white rounded-sm cursor-move"
                  style={{
                    left: cropRect.x,
                    top: cropRect.y,
                    width: cropRect.w,
                    height: cropRect.h,
                  }}
                  onPointerDown={handlePointerDown}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-sm" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-sm" />
                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white rounded-sm" />
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white rounded-sm" />

                  {/* Move icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                    <Move className="w-5 h-5 text-white drop-shadow-md" />
                  </div>

                  {/* Dimension badge */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-[9px] font-mono rounded whitespace-nowrap">
                    {targetW}×{targetH}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadCropped}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-xs font-medium rounded-full hover:bg-zinc-100 transition-colors shadow-lg"
          >
            <Crop className="w-3.5 h-3.5" />
            Download Cropped ({targetW}×{targetH})
          </button>
        </div>
      </div>
    </div>
  );
}
