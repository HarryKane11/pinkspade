'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Text, Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { TextLayer } from '@/lib/shared';
import { useStudioActions } from '@/contexts/studio-context';
import { useAutoFitText } from '@/hooks/useAutoFitText';

interface TextLayerComponentProps {
  layer: TextLayer;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransform: (attrs: Partial<TextLayer>) => void;
}

export function TextLayerComponent({
  layer,
  isSelected,
  isEditing,
  onSelect,
  onTransform,
}: TextLayerComponentProps) {
  const textRef = useRef<Konva.Text>(null);
  const [textareaPosition, setTextareaPosition] = useState<{ x: number; y: number; scale: number } | null>(null);

  const { setEditingLayer, updateLayer } = useStudioActions();
  const { calculateAutoFit } = useAutoFitText();

  // Calculate auto-fit font size
  const autoFitResult = calculateAutoFit(layer);
  const displayFontSize = layer.autoFit ? autoFitResult.fontSize : layer.fontSize;

  // Update overflow warning
  useEffect(() => {
    if (layer.overflow !== autoFitResult.overflow) {
      updateLayer(layer.id, { overflow: autoFitResult.overflow });
    }
  }, [autoFitResult.overflow, layer.id, layer.overflow, updateLayer]);

  // Handle double-click to enter edit mode
  const handleDblClick = useCallback(
    () => {
      if (layer.locked || layer.brandLocked) return;

      const textNode = textRef.current;
      const stage = textNode?.getStage();
      if (!textNode || !stage) return;

      setEditingLayer(layer.id);

      // Get text position relative to stage container
      const textPosition = textNode.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();

      const areaPosition = {
        x: stageBox.left + textPosition.x * 1,
        y: stageBox.top + textPosition.y * 1,
        scale,
      };

      setTextareaPosition(areaPosition);
    },
    [layer.id, layer.locked, layer.brandLocked, setEditingLayer]
  );

  // Handle drag
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

  // Handle transform
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
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(50, node.height() * scaleY),
        },
      });
    },
    [onTransform]
  );

  // Handle text content change from textarea
  const handleTextChange = useCallback(
    (newContent: string) => {
      updateLayer(layer.id, { content: newContent });
      setEditingLayer(null);
      setTextareaPosition(null);
    },
    [layer.id, updateLayer, setEditingLayer]
  );

  // Textarea for editing
  useEffect(() => {
    if (!isEditing || !textareaPosition) return;

    const scale = textareaPosition.scale;

    // Create textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = layer.content;
    textarea.style.position = 'absolute';
    textarea.style.left = `${textareaPosition.x}px`;
    textarea.style.top = `${textareaPosition.y}px`;
    textarea.style.width = `${layer.size.width * scale}px`;
    textarea.style.height = `${layer.size.height * scale}px`;
    textarea.style.fontSize = `${displayFontSize * scale}px`;
    textarea.style.fontFamily = layer.fontFamily;
    textarea.style.fontWeight = String(layer.fontWeight);
    textarea.style.color = layer.color;
    textarea.style.textAlign = layer.textAlign;
    textarea.style.lineHeight = String(layer.lineHeight);
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.border = '2px solid #18181b';
    textarea.style.borderRadius = '2px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.zIndex = '1000';
    textarea.style.transformOrigin = 'top left';
    textarea.style.letterSpacing = `${layer.letterSpacing * scale}px`;

    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };

    const handleBlur = () => {
      handleTextChange(textarea.value);
      removeTextarea();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop propagation so Ctrl+Z works inside textarea (not caught by Konva/studio)
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingLayer(null);
        setTextareaPosition(null);
        removeTextarea();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        handleTextChange(textarea.value);
        removeTextarea();
      }
    };

    textarea.addEventListener('blur', handleBlur);
    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      textarea.removeEventListener('blur', handleBlur);
      textarea.removeEventListener('keydown', handleKeyDown);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
  }, [
    isEditing,
    textareaPosition,
    layer,
    displayFontSize,
    handleTextChange,
    setEditingLayer,
  ]);

  // Don't render text when editing (textarea is shown instead)
  if (isEditing) {
    return null;
  }

  return (
    <Group
      id={layer.id}
      name={layer.name}
      x={layer.position.x}
      y={layer.position.y}
      draggable={!layer.locked && !layer.brandLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={() => handleDblClick()}
      onDblTap={() => handleDblClick()}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Bounding box for selection */}
      <Rect
        width={layer.size.width}
        height={layer.size.height}
        fill="transparent"
        stroke={isSelected ? '#18181b' : 'transparent'}
        strokeWidth={1}
        dash={[4, 4]}
      />

      {/* Overflow warning indicator */}
      {autoFitResult.overflow && (
        <Rect
          x={layer.size.width - 16}
          y={-8}
          width={24}
          height={16}
          fill="#ef4444"
          cornerRadius={4}
        />
      )}

      {/* Text content */}
      <Text
        ref={textRef}
        width={layer.size.width}
        height={layer.size.height}
        text={layer.content}
        fontFamily={layer.fontFamily}
        fontSize={displayFontSize}
        fontStyle={layer.fontStyle}
        fontVariant="normal"
        fill={layer.color}
        align={layer.textAlign}
        verticalAlign={layer.verticalAlign}
        lineHeight={layer.lineHeight}
        letterSpacing={layer.letterSpacing}
        textDecoration={layer.textDecoration}
        opacity={layer.opacity}
        visible={layer.visible}
        wrap="word"
        ellipsis={!layer.autoFit}
      />

      {/* Brand lock indicator */}
      {layer.brandLocked && (
        <Rect
          x={-8}
          y={-8}
          width={16}
          height={16}
          fill="#6366f1"
          cornerRadius={4}
        />
      )}
    </Group>
  );
}
