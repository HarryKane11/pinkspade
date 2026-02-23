'use client';

import type { Layer } from '@/lib/shared';

interface PositionPropertiesProps {
  layer: Layer;
  onChange: (updates: Partial<Layer>) => void;
}

export function PositionProperties({ layer, onChange }: PositionPropertiesProps) {
  return (
    <div className="p-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        위치 & 크기
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Position X */}
        <div>
          <label className="label text-xs mb-1 block">X</label>
          <input
            type="number"
            value={Math.round(layer.position.x)}
            onChange={(e) =>
              onChange({
                position: {
                  ...layer.position,
                  x: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="input h-8 text-sm"
          />
        </div>

        {/* Position Y */}
        <div>
          <label className="label text-xs mb-1 block">Y</label>
          <input
            type="number"
            value={Math.round(layer.position.y)}
            onChange={(e) =>
              onChange({
                position: {
                  ...layer.position,
                  y: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="input h-8 text-sm"
          />
        </div>

        {/* Width */}
        <div>
          <label className="label text-xs mb-1 block">너비</label>
          <input
            type="number"
            value={Math.round(layer.size.width)}
            onChange={(e) =>
              onChange({
                size: {
                  ...layer.size,
                  width: parseFloat(e.target.value) || 50,
                },
              })
            }
            className="input h-8 text-sm"
            min={20}
          />
        </div>

        {/* Height */}
        <div>
          <label className="label text-xs mb-1 block">높이</label>
          <input
            type="number"
            value={Math.round(layer.size.height)}
            onChange={(e) =>
              onChange({
                size: {
                  ...layer.size,
                  height: parseFloat(e.target.value) || 50,
                },
              })
            }
            className="input h-8 text-sm"
            min={20}
          />
        </div>
      </div>

      {/* Rotation - if transform exists */}
      {layer.transform && (
        <div className="mt-3">
          <label className="label text-xs mb-1 block">회전</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              value={layer.transform.rotation}
              onChange={(e) =>
                onChange({
                  transform: {
                    ...layer.transform!,
                    rotation: parseFloat(e.target.value),
                  },
                })
              }
              className="flex-1"
            />
            <input
              type="number"
              value={Math.round(layer.transform.rotation)}
              onChange={(e) =>
                onChange({
                  transform: {
                    ...layer.transform!,
                    rotation: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="input h-8 w-16 text-sm"
              min={0}
              max={360}
            />
            <span className="text-xs text-muted-foreground">°</span>
          </div>
        </div>
      )}
    </div>
  );
}
