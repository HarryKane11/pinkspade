'use client';

import { useCallback, useRef, useState } from 'react';
import type { TextBox } from './CampaignWizard';

interface TextBoxOverlayProps {
  textBoxes: TextBox[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (updated: TextBox) => void;
  formatWidth: number;
  formatHeight: number;
  readOnly?: boolean;
}

type DragState = {
  type: 'move' | 'resize';
  boxId: string;
  startX: number;
  startY: number;
  origBox: TextBox;
};

export function TextBoxOverlay({
  textBoxes,
  selectedId,
  onSelect,
  onChange,
  readOnly = false,
}: TextBoxOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { px: 0, py: 0 };
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, box: TextBox, type: 'move' | 'resize') => {
      if (readOnly) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSelect(box.id);
      setDragState({
        type,
        boxId: box.id,
        startX: e.clientX,
        startY: e.clientY,
        origBox: { ...box },
      });
    },
    [readOnly, onSelect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
      const orig = dragState.origBox;

      if (dragState.type === 'move') {
        const newX = Math.max(0, Math.min(100 - orig.width, orig.x + dx));
        const newY = Math.max(0, Math.min(100 - orig.height, orig.y + dy));
        onChange({ ...orig, x: newX, y: newY });
      } else {
        const newW = Math.max(10, Math.min(100 - orig.x, orig.width + dx));
        const newH = Math.max(5, Math.min(100 - orig.y, orig.height + dy));
        onChange({ ...orig, width: newW, height: newH });
      }
    },
    [dragState, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current && !readOnly) {
        onSelect(null);
      }
    },
    [readOnly, onSelect],
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleContainerClick}
    >
      {textBoxes.map((tb) => {
        const isSelected = selectedId === tb.id && !readOnly;
        return (
          <div
            key={tb.id}
            className={`absolute ${readOnly ? 'pointer-events-none' : 'cursor-move'}`}
            style={{
              left: `${tb.x}%`,
              top: `${tb.y}%`,
              width: `${tb.width}%`,
              height: `${tb.height}%`,
              outline: isSelected ? '2px dashed rgba(236,72,153,0.7)' : 'none',
              outlineOffset: 2,
            }}
            onPointerDown={(e) => handlePointerDown(e, tb, 'move')}
          >
            <div
              className="w-full h-full flex items-start overflow-hidden"
              style={{
                color: tb.color,
                fontFamily: tb.fontFamily,
                fontWeight: tb.fontWeight,
                textAlign: tb.textAlign,
                fontSize: `clamp(8px, ${tb.fontSize * 0.5}px, ${tb.fontSize}px)`,
                lineHeight: 1.2,
              }}
            >
              <span className="w-full whitespace-pre-wrap break-words drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                {tb.text}
              </span>
            </div>

            {/* Resize handle */}
            {isSelected && (
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-pink-500 rounded-sm cursor-se-resize"
                onPointerDown={(e) => handlePointerDown(e, tb, 'resize')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
