import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? '',
});

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
});

// Extract colors from HTML/CSS content
function extractColors(html: string): string[] {
  const colors = new Set<string>();
  // Hex colors
  const hexMatches = html.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
  hexMatches?.forEach((c) => colors.add(c.toLowerCase()));
  // rgb/rgba
  const rgbMatches = html.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g);
  rgbMatches?.forEach((c) => colors.add(c));
  return Array.from(colors).slice(0, 20);
}

// Extract font families from HTML/CSS content
function extractFonts(html: string): string[] {
  const fonts = new Set<string>();
  const fontMatches = html.match(/font-family\s*:\s*([^;}"]+)/gi);
  fontMatches?.forEach((match) => {
    const value = match.replace(/font-family\s*:\s*/i, '').trim();
    value.split(',').forEach((f) => {
      const cleaned = f.trim().replace(/['"]/g, '');
      if (cleaned && !['inherit', 'initial', 'unset', 'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(cleaned.toLowerCase())) {
        fonts.add(cleaned);
      }
    });
  });
  return Array.from(fonts).slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Step 1: Scrape with Firecrawl
    const scrapeResult = await firecrawl.scrapeUrl(normalizedUrl, {
      formats: ['html', 'screenshot@fullPage'],
    });

    if (!scrapeResult.success) {
      return NextResponse.json(
        { error: 'Failed to scrape website', details: scrapeResult },
        { status: 502 }
      );
    }

    const html = scrapeResult.html ?? '';
    const screenshotUrl = scrapeResult.screenshot ?? '';

    // Step 2: Extract raw tokens from HTML
    const rawColors = extractColors(html);
    const rawFonts = extractFonts(html);

    // Step 3: Send to Gemini Flash via OpenRouter for semantic analysis
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a brand identity analyst. Analyze the website screenshot and extracted design tokens to produce a comprehensive Brand DNA profile. Return ONLY valid JSON, no markdown fences.

Response format:
{
  "brandName": "string",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "palette": ["#hex", "#hex", ...]
  },
  "typography": {
    "heading": "Font Family Name",
    "body": "Font Family Name",
    "style": "serif|sans-serif|mixed"
  },
  "tone": {
    "keywords": ["string", "string", "string"],
    "metrics": {
      "professional": 0-100,
      "minimalist": 0-100,
      "energetic": 0-100,
      "luxurious": 0-100,
      "friendly": 0-100
    },
    "voiceDescription": "string"
  },
  "imageStyle": {
    "description": "string",
    "keywords": ["string", "string"]
  }
}`,
      },
      {
        role: 'user',
        content: [
          ...(screenshotUrl
            ? [
                {
                  type: 'image_url' as const,
                  image_url: { url: screenshotUrl },
                },
              ]
            : []),
          {
            type: 'text' as const,
            text: `Analyze this website and extract the brand DNA.

URL: ${normalizedUrl}

Extracted colors from CSS: ${JSON.stringify(rawColors)}
Extracted fonts from CSS: ${JSON.stringify(rawFonts)}

Provide a complete Brand DNA profile in the specified JSON format.`,
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3-flash-preview',
      messages,
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content ?? '';

    // Parse JSON from response (handle possible markdown fences)
    let brandDna;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      brandDna = JSON.parse(jsonStr.trim());
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse LLM response', raw: responseText },
        { status: 502 }
      );
    }

    return NextResponse.json({
      brandDna,
      metadata: {
        url: normalizedUrl,
        rawColors,
        rawFonts,
        screenshotUrl,
        extractedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Brand DNA extraction error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
