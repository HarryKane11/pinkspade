import { z } from 'zod';

// Color palette schema
export const ColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  background: z.string().default('#ffffff'),
  text: z.string().default('#000000'),
  additional: z.array(z.string()).default([]),
});

// Typography schema
export const TypographySchema = z.object({
  headingFont: z.string().default('Pretendard'),
  bodyFont: z.string().default('Pretendard'),
  headingWeight: z.number().default(700),
  bodyWeight: z.number().default(400),
});

// Tone schema
export const ToneSchema = z.object({
  style: z.enum(['formal', 'casual', 'professional', 'friendly', 'playful', 'luxurious']),
  description: z.string(),
  keywords: z.array(z.string()),
  voiceExamples: z.array(z.string()).optional(),
});

// Image style schema
export const ImageStyleSchema = z.object({
  style: z.enum(['minimal', 'vibrant', 'natural', 'bold', 'soft', 'dramatic']),
  colorTones: z.array(z.string()),
  subjects: z.array(z.string()),
  mood: z.string(),
});

// Brand DNA schema
export const BrandDNASchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  version: z.number().int().positive(),
  isCurrent: z.boolean().default(true),

  // Core identity
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),

  // Visual identity
  logoUrl: z.string().url().optional(),
  colors: ColorPaletteSchema,
  typography: TypographySchema,

  // Voice & tone
  tone: ToneSchema,

  // Image preferences
  imageStyle: ImageStyleSchema.optional(),

  // Extracted from website
  websiteUrl: z.string().url().optional(),
  extractedAt: z.string().datetime().optional(),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Brand schema
export const BrandSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  currentDnaId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Types
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type Typography = z.infer<typeof TypographySchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type ImageStyle = z.infer<typeof ImageStyleSchema>;
export type BrandDNA = z.infer<typeof BrandDNASchema>;
export type Brand = z.infer<typeof BrandSchema>;

// Helper to create default Brand DNA
export function createDefaultBrandDNA(brandId: string, name: string): Omit<BrandDNA, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    brandId,
    version: 1,
    isCurrent: true,
    name,
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#0f172a',
      additional: [],
    },
    typography: {
      headingFont: 'Pretendard',
      bodyFont: 'Pretendard',
      headingWeight: 700,
      bodyWeight: 400,
    },
    tone: {
      style: 'professional',
      description: '전문적이고 신뢰감 있는 톤',
      keywords: ['전문성', '신뢰', '품질'],
    },
  };
}
