'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useStudio, useStudioActions, useStudioStore } from '@/contexts/studio-context';
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

interface SelectionRectState {
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

const DRAG_THRESHOLD = 5; // px minimum to count as drag vs click

export function StudioCanvas({ containerRef, stageRef: externalStageRef }: StudioCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalStageRef;

  const store = useStudioStore();
  const design = useStudio((s) => s.design);
  const viewport = useStudio((s) => s.viewport);
  const selection = useStudio((s) => s.selection);
  const activeTool = useStudio((s) => s.activeTool);

  const [selectionRect, setSelectionRect] = useState<SelectionRectState | null>(null);

  const {
    selectLayer,
    selectLayers,
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

  // Convert screen pointer to canvas coordinates — reads viewport from store to avoid callback churn
  const pointerToCanvas = useCallback(
    (pointer: { x: number; y: number }) => {
      const vp = store.getState().viewport;
      return {
        x: (pointer.x - vp.offsetX) / vp.zoom,
        y: (pointer.y - vp.offsetY) / vp.zoom,
      };
    },
    [store]
  );

  // Handle stage click: create layers for text/shape tools, deselect otherwise
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (e.target !== stage) return;

      // If a drag selection just happened, don't process as click
      if (selectionRect && (selectionRect.width > DRAG_THRESHOLD || selectionRect.height > DRAG_THRESHOLD)) {
        return;
      }

      if (activeTool === 'text' || activeTool === 'shape') {
        const pointer = stage?.getPointerPosition();
        if (!pointer) return;

        const { x: canvasX, y: canvasY } = pointerToCanvas(pointer);
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
    [activeTool, pointerToCanvas, addLayer, selectLayer, setActiveTool, deselectAll, selectionRect]
  );

  // --- Rubber-band drag selection ---

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'select') return;

      const stage = e.target.getStage();
      // Only start drag selection on empty stage area (not on layers)
      if (e.target !== stage) return;

      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      const { x, y } = pointerToCanvas(pointer);

      setSelectionRect({
        startX: x,
        startY: y,
        x,
        y,
        width: 0,
        height: 0,
        visible: true,
      });
    },
    [activeTool, pointerToCanvas]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Use the callback form of setSelectionRect to check visibility without depending on it
      setSelectionRect((prev) => {
        if (!prev?.visible) return prev;

        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!pointer) return prev;

        const { x, y } = pointerToCanvas(pointer);

        return {
          ...prev,
          x: Math.min(prev.startX, x),
          y: Math.min(prev.startY, y),
          width: Math.abs(x - prev.startX),
          height: Math.abs(y - prev.startY),
        };
      });
    },
    [pointerToCanvas]
  );

  const handleMouseUp = useCallback(() => {
    if (!selectionRect?.visible || !design) {
      setSelectionRect(null);
      return;
    }

    const rect = selectionRect;

    // Only process as drag selection if the rect is big enough
    if (rect.width > DRAG_THRESHOLD && rect.height > DRAG_THRESHOLD) {
      const intersecting = design.layers.filter((layer) => {
        if (!layer.visible || layer.locked || layer.type === 'background') return false;
        // AABB intersection test
        return !(
          layer.position.x + layer.size.width < rect.x ||
          layer.position.x > rect.x + rect.width ||
          layer.position.y + layer.size.height < rect.y ||
          layer.position.y > rect.y + rect.height
        );
      });

      if (intersecting.length > 0) {
        selectLayers(intersecting.map((l) => l.id));
      } else {
        deselectAll();
      }
    }

    setSelectionRect(null);
  }, [selectionRect, design, selectLayers, deselectAll]);

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
  // Reads viewport from store at call time for stable callback identity during pan/zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const vp = store.getState().viewport;

      // Ctrl+Wheel or Meta+Wheel: Zoom towards cursor
      if (e.evt.ctrlKey || e.evt.metaKey) {
        const oldScale = vp.zoom;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - vp.offsetX) / oldScale,
          y: (pointer.y - vp.offsetY) / oldScale,
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
      setOffset(vp.offsetX - e.evt.deltaX, vp.offsetY - e.evt.deltaY);
    },
    [store, stageRef, setOffset, setZoom]
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
      onMouseDown={(e) => handleMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onMouseMove={(e) => handleMouseMove(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onMouseUp={handleMouseUp}
      onDragEnd={handleDragEnd}
      onWheel={handleWheel}
      style={{
        backgroundColor: '#f1f5f9',
        cursor: activeTool === 'text'
          ? 'text'
          : activeTool === 'shape'
            ? 'crosshair'
            : selectionRect?.visible
              ? 'crosshair'
              : undefined,
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

        {/* Rubber-band selection rectangle */}
        {selectionRect?.visible && selectionRect.width > DRAG_THRESHOLD && (
          <Rect
            x={selectionRect.x}
            y={selectionRect.y}
            width={selectionRect.width}
            height={selectionRect.height}
            fill="rgba(236, 72, 153, 0.08)"
            stroke="#ec4899"
            strokeWidth={1 / viewport.zoom}
            dash={[4 / viewport.zoom, 4 / viewport.zoom]}
            listening={false}
          />
        )}

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
