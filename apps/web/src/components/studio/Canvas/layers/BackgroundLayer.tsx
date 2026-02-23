'use client';

import { Rect, Image } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { BackgroundLayer } from '@/lib/shared';

interface BackgroundLayerComponentProps {
  layer: BackgroundLayer;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransform: (attrs: Partial<BackgroundLayer>) => void;
}

export function BackgroundLayerComponent({
  layer,
  isSelected,
  onSelect,
  onTransform,
}: BackgroundLayerComponentProps) {
  const [image] = useImage(layer.backgroundImage ?? '');

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onTransform({
      position: {
        x: e.target.x(),
        y: e.target.y(),
      },
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to size
    node.scaleX(1);
    node.scaleY(1);

    onTransform({
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: Math.max(50, node.width() * scaleX),
        height: Math.max(50, node.height() * scaleY),
      },
    });
  };

  // Background with image
  if (layer.backgroundImage && image) {
    const { width, height } = layer.size;
    const imageRatio = image.width / image.height;
    const boxRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (layer.backgroundFit === 'cover') {
      if (imageRatio > boxRatio) {
        drawHeight = height;
        drawWidth = height * imageRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imageRatio;
        offsetY = (height - drawHeight) / 2;
      }
    } else if (layer.backgroundFit === 'contain') {
      if (imageRatio > boxRatio) {
        drawWidth = width;
        drawHeight = width / imageRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imageRatio;
        offsetX = (width - drawWidth) / 2;
      }
    }

    return (
      <>
        {/* Background color fill */}
        <Rect
          x={layer.position.x}
          y={layer.position.y}
          width={layer.size.width}
          height={layer.size.height}
          fill={layer.backgroundColor}
          listening={false}
        />
        {/* Background image */}
        <Image
          id={layer.id}
          name={layer.name}
          x={layer.position.x + offsetX}
          y={layer.position.y + offsetY}
          width={drawWidth}
          height={drawHeight}
          image={image}
          opacity={layer.opacity}
          visible={layer.visible}
          draggable={!layer.locked}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      </>
    );
  }

  // Solid color background
  return (
    <Rect
      id={layer.id}
      name={layer.name}
      x={layer.position.x}
      y={layer.position.y}
      width={layer.size.width}
      height={layer.size.height}
      fill={layer.backgroundColor}
      opacity={layer.opacity}
      visible={layer.visible}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      stroke={isSelected ? '#0ea5e9' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
