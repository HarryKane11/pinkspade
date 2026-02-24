'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MousePointer2,
  Type,
  Square,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  CloudUpload,
  FolderOpen,
  Image as ImageIcon,
  Eye,
  Coins,
} from 'lucide-react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import { cn } from '@/lib/utils';

interface StudioToolbarProps {
  onExport: () => void;
  onPreview?: () => void;
  onShare?: () => void;
}

export function StudioToolbar({ onExport, onPreview, onShare }: StudioToolbarProps) {
  const activeTool = useStudio((s) => s.activeTool);
  const viewport = useStudio((s) => s.viewport);
  const isDirty = useStudio((s) => s.isDirty);
  const design = useStudio((s) => s.design);

  const {
    setActiveTool,
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStudioActions();

  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/credits/balance')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled && data?.balance != null) setCreditBalance(data.balance); })
      .catch((err) => { console.error('Failed to fetch credit balance:', err); });
    return () => { cancelled = true; };
  }, []);

  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: '선택 (V)' },
    { id: 'text' as const, icon: Type, label: '텍스트 (T)' },
    { id: 'shape' as const, icon: Square, label: '도형 (S)' },
    { id: 'pan' as const, icon: Hand, label: '팬 (스페이스바)' },
  ];

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-6">
        <Link href="/" className="font-medium tracking-tight text-zinc-900 text-sm flex items-center gap-2 border-r border-zinc-200 pr-6 hover:opacity-80 transition-opacity">
          <img src="/company_logo.png" alt="Pink Spade" className="w-6 h-6" />
          Pink Spade
        </Link>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Link href="/workspace" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            Workspace
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            {design?.meta.name ?? '새 디자인'}
          </span>
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                'p-2 rounded-md transition-colors flex items-center justify-center',
                activeTool === tool.id
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200/50'
                  : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'
              )}
              title={tool.label}
              aria-label={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-30"
            title="실행 취소 (Ctrl+Z)"
            aria-label="실행 취소"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-30"
            title="다시 실행 (Ctrl+Shift+Z)"
            aria-label="다시 실행"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Zoom + Actions */}
      <div className="flex items-center gap-3">
        {/* Zoom controls */}
        <div className="flex items-center gap-2 mr-2">
          <button
            onClick={() => setZoom(viewport.zoom / 1.2)}
            className="text-zinc-400 hover:text-zinc-900 transition-colors"
            title="축소"
            aria-label="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-zinc-600 font-medium font-mono w-10 text-center text-xs">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(viewport.zoom * 1.2)}
            className="text-zinc-400 hover:text-zinc-900 transition-colors"
            title="확대"
            aria-label="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 hidden sm:flex">
          <span className="text-xs text-zinc-500 font-medium">Auto-save</span>
          <CloudUpload className={cn('w-3.5 h-3.5', isDirty ? 'text-amber-500' : 'text-green-500')} />
        </div>

        {/* Preview */}
        {onPreview && (
          <button
            onClick={onPreview}
            className="text-xs font-medium text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm flex items-center gap-2"
            title="미리보기"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        )}

        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className="text-xs font-medium text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        )}

        {/* Credits badge */}
        {creditBalance !== null && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            title="크레딧 잔액"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-zinc-700">{creditBalance.toLocaleString()}</span>
          </Link>
        )}

        {/* Export */}
        <button
          onClick={onExport}
          className="text-xs font-medium bg-zinc-900 text-white px-4 py-1.5 rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
        >
          Export Assets
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
