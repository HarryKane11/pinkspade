'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useStudio, useStudioActions } from '@/contexts/studio-context';
import { BackgroundLayerComponent } from './layers/BackgroundLayer';
import { TextLayerComponent } from './layers/TextLayer';
import { ImageLayerComponent } from './layers/ImageLayer';
import { ProductLayerComponent } from './layers/ProductLayer';
import { ShapeLayerComponent } from './layers/ShapeLayer';
import { SelectionTransformer } from './SelectionTransformer';
import type { Layer as DesignLayer } from '@/lib/shared';
import { createTextLayer, createShapeLayer } from '@/lib/shared/design-schema';

interface StudioCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export function StudioCanvas({ containerRef, stageRef: externalStageRef }: StudioCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalStageRef;

  const design = useStudio((s) => s.design);
  const viewport = useStudio((s) => s.viewport);
  const selection = useStudio((s) => s.selection);
  const activeTool = useStudio((s) => s.activeTool);

  const {
    selectLayer,
    deselectAll,
    updateLayer,
    addLayer,
    setActiveTool,
    fitToCanvas,
    setOffset,
    setZoom,
  } = useStudioActions();

  // Fit canvas when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !design) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      fitToCanvas(width, height);
    });

    resizeObserver.observe(container);

    // Initial fit
    const { width, height } = container.getBoundingClientRect();
    fitToCanvas(width, height);

    return () => resizeObserver.disconnect();
  }, [containerRef, design, fitToCanvas]);

  // Handle stage click: create layers for text/shape tools, deselect otherwise
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (e.target !== stage) return;

      if (activeTool === 'text' || activeTool === 'shape') {
        const pointer = stage?.getPointerPosition();
        if (!pointer) return;

        // Convert screen coords to canvas coords
        const canvasX = (pointer.x - viewport.offsetX) / viewport.zoom;
        const canvasY = (pointer.y - viewport.offsetY) / viewport.zoom;

        const id = crypto.randomUUID();

        if (activeTool === 'text') {
          const layer = createTextLayer(id, '텍스트를 입력하세요', {
            position: { x: canvasX, y: canvasY },
            size: { width: 200, height: 50 },
            fontSize: 24,
          });
          addLayer(layer);
          selectLayer(id);
        } else {
          const layer = createShapeLayer(id, 'rectangle', {
            position: { x: canvasX, y: canvasY },
            size: { width: 120, height: 120 },
            fill: '#e4e4e7',
            cornerRadius: 8,
          });
          addLayer(layer);
          selectLayer(id);
        }

        setActiveTool('select');
        return;
      }

      deselectAll();
    },
    [activeTool, viewport, addLayer, selectLayer, setActiveTool, deselectAll]
  );

  // Handle panning
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === e.target.getStage()) {
        const stage = e.target.getStage();
        if (stage) {
          setOffset(stage.x(), stage.y());
        }
      }
    },
    [setOffset]
  );

  // Handle wheel: Ctrl+wheel = zoom, regular wheel = pan
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Ctrl+Wheel or Meta+Wheel: Zoom towards cursor
      if (e.evt.ctrlKey || e.evt.metaKey) {
        const oldScale = viewport.zoom;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - viewport.offsetX) / oldScale,
          y: (pointer.y - viewport.offsetY) / oldScale,
        };

        const scaleBy = 1.1;
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.1, Math.min(5, newScale));

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        setZoom(clampedScale);
        setOffset(newPos.x, newPos.y);
        return;
      }

      // Regular wheel: Pan the canvas
      setOffset(viewport.offsetX - e.evt.deltaX, viewport.offsetY - e.evt.deltaY);
    },
    [viewport, setOffset, setZoom]
  );

  // Layer selection handler
  const handleLayerSelect = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      const addToSelection = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      selectLayer(layerId, addToSelection);
    },
    [selectLayer]
  );

  // Layer transform handler
  const handleLayerTransform = useCallback(
    (layerId: string, attrs: Partial<DesignLayer>) => {
      updateLayer(layerId, attrs);
    },
    [updateLayer]
  );

  if (!design) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        디자인을 불러오는 중...
      </div>
    );
  }

  const { canvas, layers } = design;

  // Render layer based on type
  const renderLayer = (layer: DesignLayer) => {
    const isSelected = selection.selectedLayerIds.includes(layer.id);
    const isEditing = selection.editingLayerId === layer.id;

    const commonProps = {
      layer,
      isSelected,
      onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
        handleLayerSelect(layer.id, e as unknown as Konva.KonvaEventObject<MouseEvent>),
      onTransform: (attrs: Partial<DesignLayer>) =>
        handleLayerTransform(layer.id, attrs),
    };

    switch (layer.type) {
      case 'background':
        return <BackgroundLayerComponent key={layer.id} {...commonProps} layer={layer} />;
      case 'text':
        return (
          <TextLayerComponent
            key={layer.id}
            {...commonProps}
            layer={layer}
            isEditing={isEditing}
          />
        );
      case 'image':
        return <ImageLayerComponent key={layer.id} {...commonProps} layer={layer} />;
      case 'product':
        return <ProductLayerComponent key={layer.id} {...commonProps} layer={layer} />;
      case 'shape':
        return <ShapeLayerComponent key={layer.id} {...commonProps} layer={layer} />;
      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={containerRef.current?.clientWidth ?? 800}
      height={containerRef.current?.clientHeight ?? 600}
      scaleX={viewport.zoom}
      scaleY={viewport.zoom}
      x={viewport.offsetX}
      y={viewport.offsetY}
      draggable={activeTool === 'pan'}
      onClick={(e) => handleStageClick(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onTap={(e) => handleStageClick(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onDragEnd={handleDragEnd}
      onWheel={handleWheel}
      style={{
        backgroundColor: '#f1f5f9',
        cursor: activeTool === 'text' ? 'text' : activeTool === 'shape' ? 'crosshair' : undefined,
      }}
    >
      <Layer>
        {/* Canvas background */}
        <CanvasBackground
          width={canvas.width}
          height={canvas.height}
          backgroundColor={canvas.backgroundColor}
        />

        {/* Render all layers in order (first = bottom) */}
        {layers.map(renderLayer)}

        {/* Selection transformer */}
        <SelectionTransformer
          selectedIds={selection.selectedLayerIds}
          stageRef={stageRef}
        />
      </Layer>
    </Stage>
  );
}

// Canvas background component
function CanvasBackground({
  width,
  height,
  backgroundColor,
}: {
  width: number;
  height: number;
  backgroundColor: string;
}) {
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill={backgroundColor}
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={20}
      shadowOffsetX={0}
      shadowOffsetY={5}
      listening={false}
    />
  );
}
