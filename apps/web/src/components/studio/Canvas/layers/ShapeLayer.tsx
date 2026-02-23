'use client';

import { useCallback } from 'react';
import { Rect, Ellipse, Line, Group } from 'react-konva';
import type Konva from 'konva';
import type { ShapeLayer } from '@/lib/shared';

interface ShapeLayerComponentProps {
  layer: ShapeLayer;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransform: (attrs: Partial<ShapeLayer>) => void;
}

export function ShapeLayerComponent({
  layer,
  isSelected,
  onSelect,
  onTransform,
}: ShapeLayerComponentProps) {
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

  const commonProps = {
    id: layer.id,
    name: layer.name,
    x: layer.position.x,
    y: layer.position.y,
    draggable: !layer.locked,
    opacity: layer.opacity,
    visible: layer.visible,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    stroke: layer.stroke ?? (isSelected ? '#0ea5e9' : undefined),
    strokeWidth: layer.strokeWidth || (isSelected ? 2 : 0),
    fill: layer.fill,
  };

  switch (layer.shapeType) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          width={layer.size.width}
          height={layer.size.height}
          cornerRadius={layer.cornerRadius}
        />
      );

    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          x={layer.position.x + layer.size.width / 2}
          y={layer.position.y + layer.size.height / 2}
          radiusX={layer.size.width / 2}
          radiusY={layer.size.height / 2}
        />
      );

    case 'line':
      const linePoints = layer.points ?? [
        0, 0,
        layer.size.width, layer.size.height,
      ];
      return (
        <Line
          {...commonProps}
          points={linePoints}
          strokeWidth={layer.strokeWidth || 2}
        />
      );

    case 'polygon':
      const polygonPoints = layer.points ?? [
        layer.size.width / 2, 0,
        layer.size.width, layer.size.height,
        0, layer.size.height,
      ];
      return (
        <Group
          x={layer.position.x}
          y={layer.position.y}
          draggable={!layer.locked}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        >
          <Line
            id={layer.id}
            name={layer.name}
            points={polygonPoints}
            closed
            fill={layer.fill}
            stroke={layer.stroke ?? (isSelected ? '#0ea5e9' : undefined)}
            strokeWidth={layer.strokeWidth || (isSelected ? 2 : 0)}
            opacity={layer.opacity}
            visible={layer.visible}
          />
        </Group>
      );

    default:
      return null;
  }
}
