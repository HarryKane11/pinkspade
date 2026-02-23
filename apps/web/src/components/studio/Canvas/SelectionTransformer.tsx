'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

interface SelectionTransformerProps {
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function SelectionTransformer({
  selectedIds,
  stageRef,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    // Find all selected nodes by their IDs
    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== undefined);

    // Attach nodes to transformer
    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  if (selectedIds.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        const minWidth = 20;
        const minHeight = 20;

        if (newBox.width < minWidth || newBox.height < minHeight) {
          return oldBox;
        }

        return newBox;
      }}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]}
      rotateEnabled={true}
      keepRatio={false}
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#18181b"
      borderStrokeWidth={1}
      anchorStroke="#18181b"
      anchorFill="#ffffff"
      rotateAnchorOffset={30}
    />
  );
}
