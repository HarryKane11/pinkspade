import { NextResponse } from 'next/server';

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY ?? '';

// Cache the response for 24h
let cachedResponse: { data: unknown; fetchedAt: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedResponse && Date.now() - cachedResponse.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cachedResponse.data, {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      });
    }

    if (!GOOGLE_FONTS_API_KEY) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const data = await res.json();
    cachedResponse = { data, fetchedAt: Date.now() };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
