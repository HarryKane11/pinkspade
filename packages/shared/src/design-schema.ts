import { z } from 'zod';

// Position schema
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Size schema
export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

// Transform schema
export const TransformSchema = z.object({
  rotation: z.number().default(0),
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
  skewX: z.number().default(0),
  skewY: z.number().default(0),
});

// Base layer schema
const BaseLayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  position: PositionSchema,
  size: SizeSchema,
  transform: TransformSchema.optional(),
});

// Background layer
export const BackgroundLayerSchema = BaseLayerSchema.extend({
  type: z.literal('background'),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().url().optional(),
  backgroundFit: z.enum(['cover', 'contain', 'fill', 'none']).default('cover'),
});

// Product layer (for photoshoot cutouts)
export const ProductLayerSchema = BaseLayerSchema.extend({
  type: z.literal('product'),
  imageUrl: z.string().url(),
  originalImageUrl: z.string().url().optional(),
  maskUrl: z.string().url().optional(),
  shadowEnabled: z.boolean().default(true),
  shadowColor: z.string().default('rgba(0,0,0,0.3)'),
  shadowBlur: z.number().default(10),
  shadowOffsetX: z.number().default(0),
  shadowOffsetY: z.number().default(5),
});

// Auto-fit configuration
export const AutoFitConfigSchema = z.object({
  minFontSize: z.number().min(6).default(12),
  maxFontSize: z.number().max(200).default(72),
  strategy: z.enum(['shrink', 'wrap', 'truncate']).default('shrink'),
});

// Text layer - CRITICAL: Always editable, never "baked" into images
export const TextLayerSchema = BaseLayerSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  fontFamily: z.string().default('Pretendard'),
  fontSize: z.number().min(6).max(200).default(16),
  fontWeight: z.number().min(100).max(900).default(400),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  color: z.string().default('#000000'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top'),
  lineHeight: z.number().default(1.4),
  letterSpacing: z.number().default(0),
  textDecoration: z.enum(['none', 'underline', 'line-through']).default('none'),
  autoFit: z.boolean().default(true),
  autoFitConfig: AutoFitConfigSchema.optional(),
  brandLocked: z.boolean().default(false), // Brand Lock: cannot edit if true
  overflow: z.boolean().default(false), // Warning flag for overflow
});

// Shape layer
export const ShapeLayerSchema = BaseLayerSchema.extend({
  type: z.literal('shape'),
  shapeType: z.enum(['rectangle', 'ellipse', 'line', 'polygon']),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().default(0),
  cornerRadius: z.number().default(0),
  points: z.array(z.number()).optional(), // For polygons and lines
});

// Image layer
export const ImageLayerSchema = BaseLayerSchema.extend({
  type: z.literal('image'),
  imageUrl: z.string().url(),
  fit: z.enum(['cover', 'contain', 'fill', 'none']).default('cover'),
  cropX: z.number().default(0),
  cropY: z.number().default(0),
  cropWidth: z.number().optional(),
  cropHeight: z.number().optional(),
});

// Union of all layer types
export const LayerSchema = z.discriminatedUnion('type', [
  BackgroundLayerSchema,
  ProductLayerSchema,
  TextLayerSchema,
  ShapeLayerSchema,
  ImageLayerSchema,
]);

// Brand lock schema
export const BrandLockSchema = z.object({
  layerId: z.string().uuid(),
  property: z.string(),
  lockedValue: z.unknown(),
  reason: z.string().optional(),
});

// Canvas schema
export const CanvasSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  backgroundColor: z.string().default('#ffffff'),
  backgroundImage: z.string().url().optional(),
});

// Meta schema
export const DesignMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  channelPresetId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive(),
});

// Main Design JSON schema
export const DesignJSONSchema = z.object({
  version: z.string().default('1.0.0'),
  meta: DesignMetaSchema,
  canvas: CanvasSchema,
  layers: z.array(LayerSchema), // Ordered by z-index (first = bottom)
  brandLocks: z.array(BrandLockSchema).default([]),
});

// Types
export type Position = z.infer<typeof PositionSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type BackgroundLayer = z.infer<typeof BackgroundLayerSchema>;
export type ProductLayer = z.infer<typeof ProductLayerSchema>;
export type TextLayer = z.infer<typeof TextLayerSchema>;
export type ShapeLayer = z.infer<typeof ShapeLayerSchema>;
export type ImageLayer = z.infer<typeof ImageLayerSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type BrandLock = z.infer<typeof BrandLockSchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type DesignMeta = z.infer<typeof DesignMetaSchema>;
export type DesignJSON = z.infer<typeof DesignJSONSchema>;

// Helper functions
export function createTextLayer(
  id: string,
  content: string,
  options: Partial<TextLayer> = {}
): TextLayer {
  return {
    id,
    name: options.name || 'Text',
    type: 'text',
    content,
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0, y: 0 },
    size: { width: 200, height: 50 },
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#000000',
    textAlign: 'left',
    verticalAlign: 'top',
    lineHeight: 1.4,
    letterSpacing: 0,
    textDecoration: 'none',
    autoFit: true,
    brandLocked: false,
    overflow: false,
    ...options,
  };
}

export function createBackgroundLayer(
  id: string,
  canvas: Canvas,
  options: Partial<BackgroundLayer> = {}
): BackgroundLayer {
  return {
    id,
    name: 'Background',
    type: 'background',
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0, y: 0 },
    size: { width: canvas.width, height: canvas.height },
    backgroundColor: canvas.backgroundColor,
    backgroundFit: 'cover',
    ...options,
  };
}

export function createProductLayer(
  id: string,
  imageUrl: string,
  options: Partial<ProductLayer> = {}
): ProductLayer {
  return {
    id,
    name: 'Product',
    type: 'product',
    imageUrl,
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0, y: 0 },
    size: { width: 200, height: 200 },
    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowOffsetY: 5,
    ...options,
  };
}

export function createImageLayer(
  id: string,
  imageUrl: string,
  options: Partial<ImageLayer> = {}
): ImageLayer {
  return {
    id,
    name: 'Image',
    type: 'image',
    imageUrl,
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0, y: 0 },
    size: { width: 200, height: 200 },
    fit: 'cover',
    cropX: 0,
    cropY: 0,
    ...options,
  };
}

export function createShapeLayer(
  id: string,
  shapeType: ShapeLayer['shapeType'],
  options: Partial<ShapeLayer> = {}
): ShapeLayer {
  return {
    id,
    name: 'Shape',
    type: 'shape',
    shapeType,
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    cornerRadius: 0,
    strokeWidth: 0,
    ...options,
  };
}
