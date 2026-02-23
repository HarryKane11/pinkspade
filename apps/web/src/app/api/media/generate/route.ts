import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Server-side: use FAL_KEY directly (proxy is for client-side only)
fal.config({
  credentials: process.env.FAL_KEY ?? "",
});

// ─── Supported Models (server-side mirror of lib/fal.ts registry) ───

const ALLOWED_MODELS: Record<string, string> = {
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "flux-pro-ultra": "fal-ai/flux-pro/v1.1-ultra",
  "recraft-v4": "fal-ai/recraft/v4/text-to-image",
  "recraft-v4-pro": "fal-ai/recraft/v4/pro/text-to-image",
  "recraft-v4-vector": "fal-ai/recraft/v4/text-to-vector",
  "flux-kontext": "fal-ai/flux-pro/kontext",
};

// ─── Format → Size Mapping ───

const FORMAT_TO_SIZE: Record<string, string> = {
  "feed": "square_hd",
  "story": "portrait_16_9",
  "banner": "landscape_16_9",
  "custom": "square_hd",
};

const FORMAT_TO_ASPECT: Record<string, string> = {
  "feed": "1:1",
  "story": "9:16",
  "banner": "16:9",
  "custom": "1:1",
};

// ─── Request Schema ───

interface MediaGenerateRequest {
  prompt: string;
  modelId?: string; // Our model ID (e.g. "flux-dev"), defaults to "flux-dev"
  format?: string; // "feed" | "story" | "banner" | "custom"
  imageSize?: string; // Direct fal size override
  aspectRatio?: string; // Direct aspect ratio override (for flux-pro-ultra)
  numImages?: number;
  negativePrompt?: string;
  // Brand DNA context (will be woven into prompt)
  brandDna?: {
    colors?: { primary?: string; secondary?: string; accent?: string };
    tone?: { keywords?: string[] };
  };
  // For kontext: input image URL
  inputImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MediaGenerateRequest = await request.json();
    const {
      prompt,
      modelId = "flux-dev",
      format = "feed",
      imageSize,
      aspectRatio,
      numImages = 1,
      negativePrompt,
      brandDna,
      inputImageUrl,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const falModelId = ALLOWED_MODELS[modelId];
    if (!falModelId) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}. Available: ${Object.keys(ALLOWED_MODELS).join(", ")}` },
        { status: 400 }
      );
    }

    // Build enhanced prompt with brand context
    let enhancedPrompt = prompt;
    if (brandDna) {
      const parts: string[] = [];
      if (brandDna.colors) {
        const c = brandDna.colors;
        parts.push(`Use brand colors: ${[c.primary, c.secondary, c.accent].filter(Boolean).join(", ")}`);
      }
      if (brandDna.tone?.keywords?.length) {
        parts.push(`Style: ${brandDna.tone.keywords.join(", ")}`);
      }
      if (parts.length > 0) {
        enhancedPrompt = `${prompt}. ${parts.join(". ")}.`;
      }
    }

    // Build fal input based on model type
    const isProUltra = modelId === "flux-pro-ultra";
    const isKontext = modelId === "flux-kontext";
    const isRecraft = modelId.startsWith("recraft");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input: Record<string, any> = {
      prompt: enhancedPrompt,
    };

    // Size / aspect ratio
    if (isProUltra) {
      input.aspect_ratio = aspectRatio || FORMAT_TO_ASPECT[format] || "1:1";
    } else {
      input.image_size = imageSize || FORMAT_TO_SIZE[format] || "square_hd";
    }

    // Num images
    if (numImages > 1 && !isProUltra && !isKontext) {
      input.num_images = Math.min(numImages, 4);
    }

    // Negative prompt (FLUX models)
    if (negativePrompt && !isRecraft) {
      input.negative_prompt = negativePrompt;
    }

    // Kontext: input image
    if (isKontext && inputImageUrl) {
      input.image_url = inputImageUrl;
    }

    // Call fal.ai
    const result = await fal.subscribe(falModelId, {
      input,
      logs: false,
    });

    // Extract images from result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;

    // Most models return { images: [{ url, content_type }] }
    // Vector models may return { images: [{ url }] } with SVG
    const images = data?.images?.map((img: { url: string; content_type?: string; width?: number; height?: number }) => ({
      url: img.url,
      contentType: img.content_type || "image/png",
      width: img.width,
      height: img.height,
    })) ?? [];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images generated", raw: JSON.stringify(data).slice(0, 500) },
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
