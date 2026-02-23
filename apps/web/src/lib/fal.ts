import { fal } from "@fal-ai/client";

// Configure fal client to use the proxy (protects API key)
fal.config({
  proxyUrl: "/api/fal/proxy",
});

// ─── Model Registry ───

export type MediaType = "image" | "video";

export type CreditTier = "basic" | "pro" | "ultra";
export type SizeMode = "image_size" | "aspect_ratio";

export interface FalModel {
  id: string;
  falId: string; // fal.ai model endpoint ID
  name: string;
  nameKo: string;
  type: MediaType;
  description: string;
  speed: "fast" | "standard" | "slow";
  quality: "standard" | "high" | "ultra";
  sizeMode: SizeMode; // how the model accepts size params
  supportedSizes: string[]; // image_size mode presets
  supportedAspectRatios?: string[]; // aspect_ratio mode enum values
  defaultSize: string;
  maxImages?: number;
  supportsImageInput?: boolean; // can accept product/layout image
  creditTier: CreditTier; // billing tier
}

export const FAL_MODELS: FalModel[] = [
  // ─── Fast / Draft ───
  {
    id: "flux-schnell",
    falId: "fal-ai/flux/schnell",
    name: "FLUX Schnell",
    nameKo: "FLUX 빠른생성",
    type: "image",
    description: "1-4 step generation, fastest option for drafts and iterations",
    speed: "fast",
    quality: "standard",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    maxImages: 4,
    creditTier: "basic",
  },
  // ─── Standard / Balanced ───
  {
    id: "flux-dev",
    falId: "fal-ai/flux/dev",
    name: "FLUX Dev",
    nameKo: "FLUX 기본",
    type: "image",
    description: "High-quality generation with good speed, best all-rounder",
    speed: "standard",
    quality: "high",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    maxImages: 4,
    creditTier: "pro",
  },
  // ─── Pro / Ultra Quality ───
  {
    id: "flux-pro-ultra",
    falId: "fal-ai/flux-pro/v1.1-ultra",
    name: "FLUX Pro Ultra",
    nameKo: "FLUX 프로 울트라",
    type: "image",
    description: "Up to 2K resolution, maximum photo realism",
    speed: "slow",
    quality: "ultra",
    sizeMode: "aspect_ratio",
    supportedSizes: [],
    supportedAspectRatios: ["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"],
    defaultSize: "1:1",
    creditTier: "ultra",
  },
  // ─── Design / Raster ───
  {
    id: "recraft-v4",
    falId: "fal-ai/recraft/v4/text-to-image",
    name: "Recraft V4",
    nameKo: "Recraft 디자인",
    type: "image",
    description: "Design-focused generation, great for marketing materials and illustrations",
    speed: "standard",
    quality: "high",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    creditTier: "pro",
  },
  {
    id: "recraft-v4-pro",
    falId: "fal-ai/recraft/v4/pro/text-to-image",
    name: "Recraft V4 Pro",
    nameKo: "Recraft 프로",
    type: "image",
    description: "Pro-tier Recraft with enhanced detail and commercial quality",
    speed: "standard",
    quality: "high",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    creditTier: "pro",
  },
  // ─── Design / Vector ───
  {
    id: "recraft-v4-vector",
    falId: "fal-ai/recraft/v4/text-to-vector",
    name: "Recraft V4 Vector",
    nameKo: "Recraft 벡터",
    type: "image",
    description: "SVG vector generation for logos and icons",
    speed: "standard",
    quality: "high",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    creditTier: "pro",
  },
  // ─── Kontext (with image input) ───
  {
    id: "flux-kontext",
    falId: "fal-ai/flux-pro/kontext",
    name: "FLUX Kontext",
    nameKo: "FLUX 컨텍스트",
    type: "image",
    description: "Edit and restyle existing images while preserving context",
    speed: "standard",
    quality: "high",
    sizeMode: "image_size",
    supportedSizes: ["square_hd", "square", "landscape_4_3", "landscape_16_9", "portrait_4_3", "portrait_16_9"],
    defaultSize: "square_hd",
    supportsImageInput: true,
    creditTier: "pro",
  },
  // ─── Gemini via Fal ───
  {
    id: "nano-banana-pro",
    falId: "fal-ai/nano-banana-pro",
    name: "Gemini 3 Pro",
    nameKo: "Gemini 3 Pro",
    type: "image",
    description: "Google Gemini via Fal - flexible aspect ratios, 2K/4K resolution",
    speed: "standard",
    quality: "ultra",
    sizeMode: "aspect_ratio",
    supportedSizes: [],
    supportedAspectRatios: ["auto", "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
    defaultSize: "1:1",
    creditTier: "ultra",
  },
];

export function getModelById(id: string): FalModel | undefined {
  return FAL_MODELS.find((m) => m.id === id);
}

export function getModelsByType(type: MediaType): FalModel[] {
  return FAL_MODELS.filter((m) => m.type === type);
}

export { fal };
