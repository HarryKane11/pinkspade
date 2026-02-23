'use client';

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import {
  X,
  Download,
  FileImage,
  FileText,
  Package,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useStudio } from '@/contexts/studio-context';
import { cn } from '@/lib/utils';

type ExportFormat = 'png' | 'json' | 'svg' | 'ai-images';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileImage;
}

interface GeneratedAssetRef {
  id: string;
  image: string;
  format: string;
  label: string;
}

const BASE_EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'png',
    label: 'PNG Image',
    description: 'High-resolution canvas PNG export',
    icon: FileImage,
  },
  {
    id: 'svg',
    label: 'SVG Vector',
    description: 'Scalable vector graphic',
    icon: FileImage,
  },
  {
    id: 'json',
    label: 'Design JSON',
    description: 'Save design data as JSON',
    icon: FileText,
  },
];

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
  generatedAssets?: GeneratedAssetRef[];
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function ExportDialog({ open, onClose, stageRef, generatedAssets }: ExportDialogProps) {
  const design = useStudio((s) => s.design);

  const hasAiImages = generatedAssets && generatedAssets.length > 0;
  const exportOptions: ExportOption[] = hasAiImages
    ? [
        {
          id: 'ai-images',
          label: 'AI Generated Images',
          description: `${generatedAssets.length}개 이미지 다운로드`,
          icon: Package,
        },
        ...BASE_EXPORT_OPTIONS,
      ]
    : BASE_EXPORT_OPTIONS;

  const defaultFormat: ExportFormat = hasAiImages ? 'ai-images' : 'png';
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!design) return;

    setStatus('exporting');
    setProgress(0);
    setErrorMessage(null);

    try {
      setProgress(20);

      if (selectedFormat === 'ai-images' && generatedAssets && generatedAssets.length > 0) {
        // Download AI generated images
        const total = generatedAssets.length;
        for (let i = 0; i < total; i++) {
          const asset = generatedAssets[i];
          setProgress(20 + Math.round(((i + 1) / total) * 70));

          try {
            const response = await fetch(asset.image);
            const blob = await response.blob();
            const ext = blob.type.includes('svg') ? 'svg' : 'png';
            downloadBlob(blob, `${design.meta.name}-${asset.format}-${i + 1}.${ext}`);
          } catch {
            // For data URIs that fail fetch, try direct download
            const link = document.createElement('a');
            link.href = asset.image;
            link.download = `${design.meta.name}-${asset.format}-${i + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

          // Small delay between downloads to prevent browser blocking
          if (i < total - 1) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
        setProgress(100);
      } else if (selectedFormat === 'json') {
        // Export as JSON (client-side)
        const blob = new Blob([JSON.stringify(design, null, 2)], {
          type: 'application/json',
        });
        downloadBlob(blob, `${design.meta.name}.json`);
        setProgress(100);
      } else if (selectedFormat === 'png') {
        // Export PNG from the Konva stage via stageRef
        setProgress(30);

        if (!stageRef?.current) {
          throw new Error('Canvas stage not available');
        }

        const { width, height } = design.canvas;
        const stage = stageRef.current;

        // Reset viewport for clean capture
        const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
        const oldPos = { x: stage.x(), y: stage.y() };
        stage.scaleX(1);
        stage.scaleY(1);
        stage.x(0);
        stage.y(0);

        setProgress(50);
        const dataUrl = stage.toDataURL({
          x: 0,
          y: 0,
          width,
          height,
          pixelRatio: 2, // 2x for high-res export
        });

        // Restore viewport
        stage.scaleX(oldScale.x);
        stage.scaleY(oldScale.y);
        stage.x(oldPos.x);
        stage.y(oldPos.y);

        setProgress(80);

        // Convert data URL to blob and download
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        downloadBlob(blob, `${design.meta.name}.png`);
        setProgress(100);
      } else if (selectedFormat === 'svg') {
        // SVG export: create a simplified SVG from design data
        setProgress(30);
        const { width, height, backgroundColor } = design.canvas;
        const svgParts: string[] = [];
        svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
        svgParts.push(`<rect width="${width}" height="${height}" fill="${backgroundColor}" />`);

        for (const layer of design.layers) {
          if (!layer.visible) continue;
          if (layer.type === 'text' && 'content' in layer) {
            const tl = layer as { content: string; position: { x: number; y: number }; fontSize: number; fontFamily: string; color: string; fontWeight: number };
            svgParts.push(
              `<text x="${tl.position.x}" y="${tl.position.y + tl.fontSize}" font-family="${tl.fontFamily}" font-size="${tl.fontSize}" font-weight="${tl.fontWeight}" fill="${tl.color}">${escapeXml(tl.content)}</text>`
            );
          } else if (layer.type === 'shape' && 'fill' in layer) {
            const sl = layer as { position: { x: number; y: number }; size: { width: number; height: number }; fill: string; cornerRadius?: number };
            const rx = sl.cornerRadius ?? 0;
            svgParts.push(
              `<rect x="${sl.position.x}" y="${sl.position.y}" width="${sl.size.width}" height="${sl.size.height}" rx="${rx}" fill="${sl.fill}" />`
            );
          }
        }

        svgParts.push('</svg>');
        setProgress(70);
        const blob = new Blob([svgParts.join('\n')], { type: 'image/svg+xml' });
        downloadBlob(blob, `${design.meta.name}.svg`);
        setProgress(100);
      }

      setStatus('success');

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setProgress(0);
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Export failed'
      );
    }
  }, [design, selectedFormat, onClose, stageRef, generatedAssets]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => status !== 'exporting' && onClose()}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900">Export</h2>
          <button
            onClick={onClose}
            disabled={status === 'exporting'}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              <p className="text-xs text-zinc-500 mb-4">
                Choose an export format
              </p>

              <div className="space-y-2">
                {exportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                      selectedFormat === option.id
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-400'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        selectedFormat === option.id
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-400'
                      )}
                    >
                      <option.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-zinc-900">{option.label}</div>
                      <div className="text-[10px] text-zinc-500">
                        {option.description}
                      </div>
                    </div>
                    {selectedFormat === option.id && (
                      <Check className="w-4 h-4 text-zinc-900" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {status === 'exporting' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-zinc-900" />
              <p className="text-xs font-medium text-zinc-900 mb-2">Exporting...</p>
              <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2">
                <div
                  className="bg-zinc-900 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400">{progress}%</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-medium text-zinc-900">Export complete!</p>
              <p className="text-[10px] text-zinc-500">
                File downloaded
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-xs font-medium text-red-600">Export failed</p>
              <p className="text-[10px] text-zinc-500">{errorMessage}</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs font-medium text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 mt-3 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === 'idle' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
            <button
              onClick={onClose}
              className="text-xs font-medium text-zinc-600 px-4 py-2 rounded-md hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
