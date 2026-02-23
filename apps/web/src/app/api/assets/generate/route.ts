import { NextResponse } from 'next/server';

/**
 * @deprecated Use /api/media/generate instead.
 * This endpoint is no longer used by the frontend.
 * All image generation now goes through the unified Fal AI route.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use /api/media/generate instead.',
      migration: 'All models (including Gemini via nano-banana-pro) are now served through /api/media/generate',
    },
    { status: 410 }
  );
}
