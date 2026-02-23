'use client';

import { useCallback } from 'react';
import { Image, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ImageLayer } from '@/lib/shared';

interface ImageLayerComponentProps {
  layer: ImageLayer;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransform: (attrs: Partial<ImageLayer>) => void;
}

export function ImageLayerComponent({
  layer,
  isSelected,
  onSelect,
  onTransform,
}: ImageLayerComponentProps) {
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

  // Calculate image crop and fit
  const calculateImageProps = () => {
    if (!image) return {};

    const { width: boxWidth, height: boxHeight } = layer.size;
    const imageRatio = image.width / image.height;
    const boxRatio = boxWidth / boxHeight;

    const cropX = layer.cropX;
    const cropY = layer.cropY;
    const cropWidth = layer.cropWidth ?? image.width;
    const cropHeight = layer.cropHeight ?? image.height;

    let drawWidth = boxWidth;
    let drawHeight = boxHeight;
    let offsetX = 0;
    let offsetY = 0;

    switch (layer.fit) {
      case 'cover':
        if (imageRatio > boxRatio) {
          drawHeight = boxHeight;
          drawWidth = boxHeight * imageRatio;
          offsetX = (boxWidth - drawWidth) / 2;
        } else {
          drawWidth = boxWidth;
          drawHeight = boxWidth / imageRatio;
          offsetY = (boxHeight - drawHeight) / 2;
        }
        break;
      case 'contain':
        if (imageRatio > boxRatio) {
          drawWidth = boxWidth;
          drawHeight = boxWidth / imageRatio;
          offsetY = (boxHeight - drawHeight) / 2;
        } else {
          drawHeight = boxHeight;
          drawWidth = boxHeight * imageRatio;
          offsetX = (boxWidth - drawWidth) / 2;
        }
        break;
      case 'fill':
        // Just use box dimensions
        break;
      case 'none':
        drawWidth = cropWidth;
        drawHeight = cropHeight;
        break;
    }

    return {
      crop: {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      },
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
    };
  };

  const imageProps = calculateImageProps();

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
      clipFunc={(ctx) => {
        ctx.rect(0, 0, layer.size.width, layer.size.height);
      }}
    >
      {/* Selection border */}
      <Rect
        width={layer.size.width}
        height={layer.size.height}
        stroke={isSelected ? '#0ea5e9' : 'transparent'}
        strokeWidth={2}
        listening={false}
      />

      {/* Image */}
      {image && (
        <Image
          x={imageProps.offsetX ?? 0}
          y={imageProps.offsetY ?? 0}
          width={imageProps.drawWidth ?? layer.size.width}
          height={imageProps.drawHeight ?? layer.size.height}
          image={image}
          crop={imageProps.crop}
          opacity={layer.opacity}
          visible={layer.visible}
        />
      )}
    </Group>
  );
}
