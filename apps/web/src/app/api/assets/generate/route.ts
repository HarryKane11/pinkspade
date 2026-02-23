import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
});

// Format aspect ratios and designer-level prompt context per format
const FORMAT_CONFIG: Record<string, { aspectRatio: string; width: number; height: number; designGuidance: string }> = {
  feed: {
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    designGuidance: `Instagram Feed (1:1 square):
- Hero composition: product centered with generous breathing room
- Bold visual hierarchy — one focal point, minimal distraction
- Lifestyle context or gradient/abstract background that evokes the brand mood
- Negative space is intentional — let the product breathe
- Color blocking or duotone treatments work well at this ratio`,
  },
  story: {
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    designGuidance: `Instagram/TikTok Story (9:16 vertical):
- Vertical-first composition — product occupies 40-60% of the frame
- Top third: branding moment (subtle logo placement area)
- Middle: hero product shot with dramatic lighting or environment
- Bottom third: breathing room for CTA overlay area (keep clear)
- Use depth-of-field, dramatic angles, or environmental storytelling
- Full-bleed imagery works best — avoid floating objects on flat backgrounds`,
  },
  banner: {
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    designGuidance: `Web Banner / YouTube Thumbnail (16:9 landscape):
- Rule of thirds: product placed at left or right intersection point
- Wide negative space on the opposite side for text overlay area
- Cinematic feel — think editorial photography or premium ad campaigns
- Gradient overlays, atmospheric lighting, or environmental context
- Keep composition asymmetric for visual tension and interest`,
  },
  custom: {
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    designGuidance: `Custom format:
- Clean, balanced composition with strong focal point
- Premium photography aesthetic — natural lighting, subtle shadows
- Generous white space and intentional negative space`,
  },
};

interface GenerateRequest {
  prompt: string;
  brandDna?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    typography?: {
      heading?: string;
      body?: string;
    };
    tone?: {
      keywords?: string[];
      voiceDescription?: string;
    };
  };
  productImageBase64?: string;
  /** Screenshot of the user's canvas layout (Full Image mode) */
  layoutImageBase64?: string;
  format: {
    id: string;
    label: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, brandDna, productImageBase64, layoutImageBase64, format } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const formatConfig = FORMAT_CONFIG[format?.id] ?? FORMAT_CONFIG.feed;

    // Build brand context for the prompt
    let brandContext = '';
    if (brandDna) {
      const parts: string[] = [];
      if (brandDna.colors) {
        parts.push(`Brand colors: primary ${brandDna.colors.primary}, secondary ${brandDna.colors.secondary}, accent ${brandDna.colors.accent}, background ${brandDna.colors.background}`);
      }
      if (brandDna.typography) {
        parts.push(`Typography: heading font "${brandDna.typography.heading}", body font "${brandDna.typography.body}"`);
      }
      if (brandDna.tone?.keywords) {
        parts.push(`Brand tone: ${brandDna.tone.keywords.join(', ')}`);
      }
      if (brandDna.tone?.voiceDescription) {
        parts.push(`Voice: ${brandDna.tone.voiceDescription}`);
      }
      brandContext = parts.join('. ') + '.';
    }

    const hasProductImage = !!productImageBase64;
    const hasLayout = !!layoutImageBase64;

    const fullPrompt = `You are a world-class creative director and photographer creating a premium marketing campaign asset.

FORMAT: ${format?.label || 'Social Media'} (${formatConfig.aspectRatio})
${formatConfig.designGuidance}

${brandContext ? `BRAND IDENTITY:\n${brandContext}\n` : ''}
CREATIVE BRIEF: ${prompt}

${hasLayout ? `CRITICAL — LAYOUT REFERENCE PROVIDED:
The first attached image is a screenshot of the user's canvas layout. You MUST follow this layout as closely as possible:
- Match the overall composition, spacing, and visual hierarchy exactly.
- Respect where elements are positioned (product placement, empty areas for text, background zones).
- Generate a photorealistic, high-quality version that transforms this layout into a premium marketing asset.
- Keep the same structure but elevate it with professional lighting, textures, and depth.
- Where text placeholders exist in the layout, leave those areas clean for text overlay later.` : ''}

${hasProductImage ? `CRITICAL — PRODUCT IMAGE PROVIDED:
The attached image is the actual product photo. You MUST feature this exact product prominently in the generated image. Compose the scene AROUND this product — it is the hero element. Create an elevated, editorial-quality environment or background that complements the product. Do NOT alter the product itself.` : ''}

STRICT RULES:
1. DO NOT include any text, typography, words, letters, numbers, or watermarks in the image. The image must be purely visual — zero text of any kind.
2. Create a photorealistic, high-end advertising aesthetic — think Apple, Aesop, or Glossier campaign quality.
3. Use cinematic lighting, natural shadows, and depth-of-field for a premium feel.
4. The color palette should harmonize with the brand colors provided above.
5. Composition must feel intentional and art-directed, not AI-generated or stock-photo-like.
6. Leave clean areas where text could be overlaid later (this will be done separately in a design tool).`;

    // Build messages
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    // Add layout screenshot first (so the model sees it as the primary reference)
    if (layoutImageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: layoutImageBase64.startsWith('data:')
            ? layoutImageBase64
            : `data:image/png;base64,${layoutImageBase64}`,
        },
      });
    }

    // Add product image if provided
    if (productImageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: productImageBase64.startsWith('data:')
            ? productImageBase64
            : `data:image/png;base64,${productImageBase64}`,
        },
      });
    }

    userContent.push({
      type: 'text',
      text: fullPrompt,
    });

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3-pro-image-preview',
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      // @ts-expect-error - OpenRouter-specific parameters for image generation
      modalities: ['image', 'text'],
      image_config: {
        aspect_ratio: formatConfig.aspectRatio,
      },
    });

    const message = completion.choices[0]?.message;

    // Extract generated image from response
    // OpenRouter returns images in message content parts or as inline_data
    let generatedImageBase64: string | null = null;
    let textResponse = '';

    if (message?.content) {
      // If content is a string, it's just text
      if (typeof message.content === 'string') {
        textResponse = message.content;
      }
    }

    // Check for images in the response (OpenRouter format)
    const rawMessage = message as unknown as Record<string, unknown>;
    if (rawMessage?.images && Array.isArray(rawMessage.images)) {
      const firstImage = rawMessage.images[0] as { image_url?: { url?: string } } | undefined;
      if (firstImage?.image_url?.url) {
        generatedImageBase64 = firstImage.image_url.url;
      }
    }

    // Also check content parts for image data
    if (!generatedImageBase64 && Array.isArray(message?.content)) {
      for (const part of message.content as Array<Record<string, unknown>>) {
        if (part.type === 'image_url' && typeof part.image_url === 'object' && part.image_url !== null) {
          const imgUrl = part.image_url as { url?: string };
          generatedImageBase64 = imgUrl.url ?? null;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        {
          error: 'No image generated',
          textResponse,
          raw: JSON.stringify(message).slice(0, 500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      image: generatedImageBase64,
      format: format?.id,
      text: textResponse,
    });
  } catch (err) {
    console.error('Asset generation error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
