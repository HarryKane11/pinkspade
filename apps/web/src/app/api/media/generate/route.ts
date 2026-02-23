import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getModelById } from "@/lib/fal";
import { mapToAspectRatio, mapToImageSize } from "@/lib/size-mapping";
import { getCreditCost } from "@/lib/credits";
import { checkAndDeductCredits, refundCredits } from "@/lib/credit-middleware";
import { createClient } from "@/lib/supabase/server";

// Server-side: use FAL_KEY directly (proxy is for client-side only)
fal.config({
  credentials: process.env.FAL_KEY ?? "",
});

// ─── Supported Models (server-side allowlist) ───

const ALLOWED_MODELS: Record<string, string> = {
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "flux-pro-ultra": "fal-ai/flux-pro/v1.1-ultra",
  "recraft-v4": "fal-ai/recraft/v4/text-to-image",
  "recraft-v4-pro": "fal-ai/recraft/v4/pro/text-to-image",
  "recraft-v4-vector": "fal-ai/recraft/v4/text-to-vector",
  "flux-kontext": "fal-ai/flux-pro/kontext",
  "nano-banana-pro": "fal-ai/nano-banana-pro",
};

// ─── Fallback Format → Size (legacy, used when width/height not provided) ───

const FORMAT_TO_SIZE: Record<string, string> = {
  feed: "square_hd",
  story: "portrait_16_9",
  banner: "landscape_16_9",
  custom: "square_hd",
};

const FORMAT_TO_ASPECT: Record<string, string> = {
  feed: "1:1",
  story: "9:16",
  banner: "16:9",
  custom: "1:1",
};

// ─── Helpers ───

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const clean = match[1];
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

// ─── Request Schema ───

interface MediaGenerateRequest {
  prompt: string;
  modelId?: string;
  width?: number; // channel preset exact pixel width
  height?: number; // channel preset exact pixel height
  format?: string; // fallback: "feed" | "story" | "banner" | "custom"
  numImages?: number;
  resolution?: string; // nano-banana-pro: "1K" | "2K" | "4K"
  negativePrompt?: string;
  brandDna?: {
    colors?: { primary?: string; secondary?: string; accent?: string };
    tone?: { keywords?: string[] };
  };
  productImageBase64?: string; // product photo (base64 data URI)
  layoutImageBase64?: string; // canvas screenshot (base64 data URI)
  inputImageUrl?: string; // legacy: direct image URL for kontext
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body: MediaGenerateRequest = await request.json();
    const {
      prompt,
      modelId = "flux-dev",
      width,
      height,
      format = "feed",
      numImages: rawNumImages = 1,
      resolution,
      negativePrompt,
      brandDna,
      productImageBase64,
      layoutImageBase64,
      inputImageUrl,
    } = body;

    // Cap numImages to prevent cost explosion
    const numImages = Math.max(1, Math.min(rawNumImages, 4));

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const falModelId = ALLOWED_MODELS[modelId];
    if (!falModelId) {
      return NextResponse.json(
        {
          error: `Unknown model: ${modelId}. Available: ${Object.keys(ALLOWED_MODELS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ─── Credit Check ───
    const cost = getCreditCost(modelId);
    const creditResult = await checkAndDeductCredits(cost, "generation", modelId);
    if (!creditResult.success) {
      return NextResponse.json(
        {
          error: creditResult.error === "insufficient_credits"
            ? "Insufficient credits"
            : "Credit check failed",
          creditError: true,
          balance: creditResult.balance,
          required: cost,
        },
        { status: 402 }
      );
    }

    // Get model metadata from registry
    const model = getModelById(modelId);
    const isKontext = modelId === "flux-kontext";
    const isRecraft = modelId.startsWith("recraft");
    const isNanoBanana = modelId === "nano-banana-pro";

    // Build enhanced prompt with brand context
    let enhancedPrompt = prompt;
    if (brandDna) {
      const parts: string[] = [];
      if (brandDna.colors && !isRecraft) {
        // Recraft uses native colors param instead
        const c = brandDna.colors;
        parts.push(
          `Use brand colors: ${[c.primary, c.secondary, c.accent].filter(Boolean).join(", ")}`
        );
      }
      if (brandDna.tone?.keywords?.length) {
        parts.push(`Style: ${brandDna.tone.keywords.join(", ")}`);
      }
      if (parts.length > 0) {
        enhancedPrompt = `${prompt}. ${parts.join(". ")}.`;
      }
    }

    // If product image provided but model doesn't support image input,
    // enhance the prompt to emphasize product placement
    if (productImageBase64 && !isKontext) {
      enhancedPrompt = `${enhancedPrompt} Feature the product prominently as the hero element in the composition.`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input: Record<string, any> = {
      prompt: enhancedPrompt,
    };

    // ─── Smart Size Mapping ───
    if (width && height && model) {
      if (model.sizeMode === "aspect_ratio" && model.supportedAspectRatios) {
        input.aspect_ratio = mapToAspectRatio(
          width,
          height,
          model.supportedAspectRatios
        );
      } else {
        input.image_size = mapToImageSize(width, height);
      }
    } else {
      // Fallback to format-based mapping
      if (
        model?.sizeMode === "aspect_ratio" &&
        model.supportedAspectRatios
      ) {
        input.aspect_ratio = FORMAT_TO_ASPECT[format] || "1:1";
      } else {
        input.image_size = FORMAT_TO_SIZE[format] || "square_hd";
      }
    }

    // ─── nano-banana-pro: resolution param ───
    if (isNanoBanana && resolution) {
      input.resolution = resolution;
    }

    // ─── Num images ───
    if (numImages > 1 && !isKontext && model?.maxImages) {
      input.num_images = Math.min(numImages, model.maxImages);
    }

    // ─── Negative prompt (FLUX models only) ───
    if (negativePrompt && !isRecraft && !isNanoBanana) {
      input.negative_prompt = negativePrompt;
    }

    // ─── Kontext: image input (product image > layout image > legacy URL) ───
    if (isKontext) {
      const imageUrl = productImageBase64 || layoutImageBase64 || inputImageUrl;
      if (imageUrl) {
        input.image_url = imageUrl.startsWith("data:")
          ? imageUrl
          : `data:image/png;base64,${imageUrl}`;
      }
    }

    // ─── Recraft: native brand colors ───
    if (isRecraft && brandDna?.colors) {
      const colorValues = [
        brandDna.colors.primary,
        brandDna.colors.secondary,
        brandDna.colors.accent,
      ].filter(Boolean) as string[];
      if (colorValues.length > 0) {
        input.colors = colorValues.map((hex) => hexToRgb(hex)).filter(Boolean);
      }
    }

    // Call fal.ai
    let result;
    try {
      result = await fal.subscribe(falModelId, {
        input,
        logs: false,
      });
    } catch (falErr) {
      // Generation failed — refund credits
      console.error("Fal AI error:", falErr);
      await refundCredits(cost, modelId).catch(() => {});
      const message = falErr instanceof Error ? falErr.message : "Generation failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Extract images from result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;

    // Most models return { images: [{ url, content_type }] }
    // Vector models may return { images: [{ url }] } with SVG
    const images =
      data?.images?.map(
        (img: {
          url: string;
          content_type?: string;
          width?: number;
          height?: number;
        }) => ({
          url: img.url,
          contentType: img.content_type || "image/png",
          width: img.width,
          height: img.height,
        })
      ) ?? [];

    if (images.length === 0) {
      // Refund credits — no images produced
      await refundCredits(cost, modelId).catch(() => {});
      return NextResponse.json(
        {
          error: "No images generated",
          raw: JSON.stringify(data).slice(0, 500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      images,
      model: modelId,
      format,
      requestId: result.requestId,
    });
  } catch (err) {
    console.error("Media generation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
