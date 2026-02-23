'use client';

import { useCallback, useMemo } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Image,
  Type,
  Square,
  Box,
  Palette,
} from 'lucide-react';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import { cn } from '@/lib/utils';
import type { Layer } from '@/lib/shared';

export function LayerPanel() {
  const design = useStudio((s) => s.design);
  const selection = useStudio((s) => s.selection);

  const {
    selectLayer,
    updateLayer,
    removeLayer,
    duplicateLayer,
    reorderLayers,
  } = useStudioActions();

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'background': return Palette;
      case 'text': return Type;
      case 'image': return Image;
      case 'product': return Box;
      case 'shape': return Square;
      default: return Layers;
    }
  };

  const handleMoveLayer = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (!design) return;
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= design.layers.length) return;
      reorderLayers(index, newIndex);
    },
    [design, reorderLayers]
  );

  const handleToggleVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      updateLayer(layerId, { visible: !visible });
    },
    [updateLayer]
  );

  const handleToggleLock = useCallback(
    (layerId: string, locked: boolean) => {
      updateLayer(layerId, { locked: !locked });
    },
    [updateLayer]
  );

  const displayLayers = useMemo(
    () => design ? [...design.layers].reverse() : [],
    [design]
  );

  if (!design) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        디자인을 불러오는 중...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Layer list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {displayLayers.length === 0 ? (
          <div className="text-center text-zinc-400 text-xs py-8">
            레이어가 없습니다
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {displayLayers.map((layer, displayIndex) => {
              const actualIndex = design.layers.length - 1 - displayIndex;
              const isSelected = selection.selectedLayerIds.includes(layer.id);
              const Icon = getLayerIcon(layer.type);

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors group',
                    isSelected
                      ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 shadow-sm'
                      : 'hover:bg-zinc-50 border border-transparent',
                    !layer.visible && 'opacity-50'
                  )}
                  onClick={() => selectLayer(layer.id)}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-zinc-500' : 'text-zinc-400')} />

                  <div className="flex-1 min-w-0">
                    <span className={cn('text-xs truncate block', isSelected ? 'font-medium' : 'text-zinc-600')}>
                      {layer.name}
                    </span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveLayer(actualIndex, 'up'); }}
                      disabled={actualIndex === design.layers.length - 1}
                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                      title="앞으로"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveLayer(actualIndex, 'down'); }}
                      disabled={actualIndex === 0}
                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                      title="뒤로"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id, layer.visible); }}
                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900"
                      title={layer.visible ? '숨기기' : '표시'}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id, layer.locked); }}
                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900"
                      title={layer.locked ? '잠금 해제' : '잠금'}
                    >
                      {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900"
                      title="복제"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                      className="p-0.5 rounded text-red-400 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Visibility icon when not hovered */}
                  {isSelected && (
                    <Eye className="w-3.5 h-3.5 text-zinc-400 group-hover:hidden" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
