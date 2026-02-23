'use client';

import type { Layer } from '@/lib/shared';

interface AppearancePropertiesProps {
  layer: Layer;
  onChange: (updates: Partial<Layer>) => void;
}

export function AppearanceProperties({ layer, onChange }: AppearancePropertiesProps) {
  return (
    <div className="p-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        외형
      </h4>

      <div className="space-y-3">
        {/* Opacity */}
        <div>
          <label className="label text-xs mb-1 block">불투명도</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={layer.opacity}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <input
              type="number"
              value={Math.round(layer.opacity * 100)}
              onChange={(e) =>
                onChange({ opacity: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100 })
              }
              className="input h-8 w-16 text-sm"
              min={0}
              max={100}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        {/* Background color for shapes/background */}
        {(layer.type === 'background' || layer.type === 'shape') && (
          <div>
            <label className="label text-xs mb-1 block">
              {layer.type === 'background' ? '배경색' : '채우기'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  layer.type === 'background'
                    ? layer.backgroundColor || '#ffffff'
                    : layer.type === 'shape'
                    ? layer.fill || '#000000'
                    : '#ffffff'
                }
                onChange={(e) => {
                  if (layer.type === 'background') {
                    onChange({ backgroundColor: e.target.value });
                  } else if (layer.type === 'shape') {
                    onChange({ fill: e.target.value });
                  }
                }}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={
                  layer.type === 'background'
                    ? layer.backgroundColor || '#ffffff'
                    : layer.type === 'shape'
                    ? layer.fill || '#000000'
                    : '#ffffff'
                }
                onChange={(e) => {
                  if (layer.type === 'background') {
                    onChange({ backgroundColor: e.target.value });
                  } else if (layer.type === 'shape') {
                    onChange({ fill: e.target.value });
                  }
                }}
                className="input h-8 flex-1 text-sm font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {/* Stroke for shapes */}
        {layer.type === 'shape' && (
          <>
            <div>
              <label className="label text-xs mb-1 block">선 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={layer.stroke || '#000000'}
                  onChange={(e) => onChange({ stroke: e.target.value })}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={layer.stroke || '#000000'}
                  onChange={(e) => onChange({ stroke: e.target.value })}
                  className="input h-8 flex-1 text-sm font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="label text-xs mb-1 block">선 두께</label>
              <input
                type="number"
                value={layer.strokeWidth}
                onChange={(e) =>
                  onChange({ strokeWidth: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="input h-8 text-sm"
                min={0}
                max={50}
              />
            </div>

            {layer.shapeType === 'rectangle' && (
              <div>
                <label className="label text-xs mb-1 block">모서리 둥글기</label>
                <input
                  type="number"
                  value={layer.cornerRadius}
                  onChange={(e) =>
                    onChange({ cornerRadius: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  className="input h-8 text-sm"
                  min={0}
                />
              </div>
            )}
          </>
        )}

        {/* Shadow for product layers */}
        {layer.type === 'product' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label text-xs">그림자</label>
              <input
                type="checkbox"
                checked={layer.shadowEnabled}
                onChange={(e) => onChange({ shadowEnabled: e.target.checked })}
                className="rounded"
              />
            </div>

            {layer.shadowEnabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs mb-1 block">X 오프셋</label>
                    <input
                      type="number"
                      value={layer.shadowOffsetX}
                      onChange={(e) =>
                        onChange({ shadowOffsetX: parseFloat(e.target.value) || 0 })
                      }
                      className="input h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Y 오프셋</label>
                    <input
                      type="number"
                      value={layer.shadowOffsetY}
                      onChange={(e) =>
                        onChange({ shadowOffsetY: parseFloat(e.target.value) || 0 })
                      }
                      className="input h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-xs mb-1 block">블러</label>
                  <input
                    type="number"
                    value={layer.shadowBlur}
                    onChange={(e) =>
                      onChange({ shadowBlur: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="input h-8 text-sm"
                    min={0}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
