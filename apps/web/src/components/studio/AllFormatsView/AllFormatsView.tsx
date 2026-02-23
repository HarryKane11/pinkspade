'use client';

import { Eye } from 'lucide-react';
import type { CampaignFormat } from '../AssetGenerator/AssetGeneratorPanel';

interface AllFormatsViewProps {
  formats: CampaignFormat[];
  snapshots: Map<string, string>;
  onSelectFormat: (formatId: string) => void;
}

export function AllFormatsView({ formats, snapshots, onSelectFormat }: AllFormatsViewProps) {
  const activeFormats = formats.filter((f) => f.checked);

  if (activeFormats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-400">Add channels to see all formats</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-100 overflow-auto p-6">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {activeFormats.map((fmt) => {
          const snapshot = snapshots.get(fmt.id);
          const ratio = fmt.width / fmt.height;

          return (
            <button
              key={fmt.id}
              onClick={() => onSelectFormat(fmt.id)}
              className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-lg transition-all text-left"
            >
              {/* Preview area with correct aspect ratio */}
              <div
                className="relative w-full bg-zinc-50 overflow-hidden"
                style={{ aspectRatio: `${fmt.width}/${fmt.height}`, maxHeight: '240px' }}
              >
                {snapshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={snapshot}
                    alt={fmt.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className="mx-auto mb-2 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center"
                        style={{
                          width: `${Math.min(60, 60 * ratio)}px`,
                          height: `${Math.min(60, 60 / ratio)}px`,
                        }}
                      >
                        <Eye className="w-4 h-4 text-zinc-300" />
                      </div>
                      <p className="text-[9px] text-zinc-300 font-medium">Preview</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-white bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    Edit
                  </span>
                </div>

                {/* Channel logo badge */}
                {fmt.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fmt.logo}
                    alt=""
                    className="absolute top-2 left-2 w-4 h-4 rounded-sm object-contain bg-white/80 backdrop-blur-sm p-0.5"
                  />
                )}
              </div>

              {/* Info bar */}
              <div className="px-3 py-2 border-t border-zinc-100">
                <div className="text-[11px] font-medium text-zinc-900 truncate">{fmt.label}</div>
                <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
                  {fmt.width}×{fmt.height}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
