'use client';

import { useCallback } from 'react';
import { Image, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ProductLayer } from '@/lib/shared';

interface ProductLayerComponentProps {
  layer: ProductLayer;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransform: (attrs: Partial<ProductLayer>) => void;
}

export function ProductLayerComponent({
  layer,
  isSelected,
  onSelect,
  onTransform,
}: ProductLayerComponentProps) {
  const [image, status] = useImage(layer.imageUrl, 'anonymous');

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onTransform({
        position: {
          x: e.target.x(),
          y: e.target.y(),
        },
      });
    },
    [onTransform]
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
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
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
        },
      });
    },
    [onTransform]
  );

  // Calculate image dimensions to fit while maintaining aspect ratio
  const calculateImageSize = () => {
    if (!image) return { width: layer.size.width, height: layer.size.height };

    const imageRatio = image.width / image.height;
    const boxRatio = layer.size.width / layer.size.height;

    if (imageRatio > boxRatio) {
      // Image is wider - fit to width
      return {
        width: layer.size.width,
        height: layer.size.width / imageRatio,
      };
    } else {
      // Image is taller - fit to height
      return {
        width: layer.size.height * imageRatio,
        height: layer.size.height,
      };
    }
  };

  const imageSize = calculateImageSize();
  const imageOffset = {
    x: (layer.size.width - imageSize.width) / 2,
    y: (layer.size.height - imageSize.height) / 2,
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Group
        id={layer.id}
        name={layer.name}
        x={layer.position.x}
        y={layer.position.y}
      >
        <Rect
          width={layer.size.width}
          height={layer.size.height}
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth={1}
          dash={[4, 4]}
        />
      </Group>
    );
  }

  // Error state
  if (status === 'failed') {
    return (
      <Group
        id={layer.id}
        name={layer.name}
        x={layer.position.x}
        y={layer.position.y}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Rect
          width={layer.size.width}
          height={layer.size.height}
          fill="#fef2f2"
          stroke="#ef4444"
          strokeWidth={1}
        />
      </Group>
    );
  }

  return (
    <Group
      id={layer.id}
      name={layer.name}
      x={layer.position.x}
      y={layer.position.y}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Selection border */}
      <Rect
        width={layer.size.width}
        height={layer.size.height}
        stroke={isSelected ? '#0ea5e9' : 'transparent'}
        strokeWidth={2}
        listening={false}
      />

      {/* Product image with shadow */}
      {image && (
        <Image
          x={imageOffset.x}
          y={imageOffset.y}
          width={imageSize.width}
          height={imageSize.height}
          image={image}
          opacity={layer.opacity}
          visible={layer.visible}
          shadowEnabled={layer.shadowEnabled}
          shadowColor={layer.shadowColor}
          shadowBlur={layer.shadowBlur}
          shadowOffsetX={layer.shadowOffsetX}
          shadowOffsetY={layer.shadowOffsetY}
        />
      )}

      {/* Product indicator badge */}
      <Rect
        x={layer.size.width - 20}
        y={-6}
        width={26}
        height={14}
        fill="#10b981"
        cornerRadius={3}
        visible={isSelected}
      />
    </Group>
  );
}
