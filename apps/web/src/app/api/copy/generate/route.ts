import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
});

interface CopyRequest {
  textLayers: { id: string; name: string; content: string }[];
  brandDna?: {
    brandName?: string;
    colors?: Record<string, string>;
    typography?: Record<string, string>;
    tone?: {
      keywords?: string[];
      voiceDescription?: string;
    };
  };
  productName?: string;
  moods?: string[];
  prompt?: string;
  userCopyPrompt?: string;
  channelCategory?: string;
}

// Channel-specific copywriting guidelines
const CHANNEL_COPY_GUIDELINES: Record<string, string> = {
  instagram: `Instagram Copy Guidelines:
- Keep it SHORT and punchy — headlines 2-5 words, descriptions 1 sentence
- Use hashtag-friendly language
- Emoji-friendly but don't overdo it
- Focus on visual storytelling language
- CTA should feel casual and engaging (e.g. "링크 확인하기", "지금 바로")`,
  naver: `Naver Blog/Post Copy Guidelines:
- Write longer, more informative copy — SEO-optimized
- Include relevant keywords naturally
- Formal but approachable tone
- Descriptions can be 2-3 sentences with key benefits
- Headlines should be search-friendly and informative`,
  kakao: `Kakao Copy Guidelines:
- Conversational and friendly tone (반말 or 존댓말 based on brand)
- Keep it warm and personal — like chatting with a friend
- Short punchy lines that work in chat-like contexts
- Use Korean-friendly expressions and phrasing`,
  youtube: `YouTube Copy Guidelines:
- Headlines should provoke curiosity or urgency
- Use click-worthy language without being clickbait
- Descriptions should preview the value
- CTA should drive engagement (구독, 좋아요, 알림 설정)`,
  coupang: `Coupang/E-commerce Copy Guidelines:
- Focus on product benefits and features
- Use persuasive, conversion-focused language
- Include key selling points concisely
- CTA should drive purchase intent (지금 구매, 한정 수량)`,
  facebook: `Facebook Copy Guidelines:
- Engaging and shareable language
- Balance between informative and conversational
- Headlines that stop scrolling
- Descriptions that drive engagement and shares`,
};

export async function POST(request: NextRequest) {
  try {
    const body: CopyRequest = await request.json();
    const { textLayers, brandDna, productName, moods, prompt, userCopyPrompt, channelCategory } = body;

    if (!textLayers || textLayers.length === 0) {
      return NextResponse.json({ error: 'No text layers provided' }, { status: 400 });
    }

    // Build context
    const contextParts: string[] = [];
    if (brandDna?.brandName) contextParts.push(`Brand: ${brandDna.brandName}`);
    if (brandDna?.tone?.keywords?.length) contextParts.push(`Brand tone: ${brandDna.tone.keywords.join(', ')}`);
    if (brandDna?.tone?.voiceDescription) contextParts.push(`Voice: ${brandDna.tone.voiceDescription}`);
    if (productName) contextParts.push(`Product: ${productName}`);
    if (moods?.length) contextParts.push(`Creative mood: ${moods.join(', ')}`);
    if (prompt) contextParts.push(`Creative direction: ${prompt}`);
    if (userCopyPrompt) contextParts.push(`Copy direction from user: ${userCopyPrompt}`);

    // Channel-specific guidelines
    const channelGuidelines = channelCategory
      ? CHANNEL_COPY_GUIDELINES[channelCategory] || ''
      : '';

    const layerDescriptions = textLayers.map((l) =>
      `- "${l.name}" (current: "${l.content}")`
    ).join('\n');

    const fullPrompt = `You are an expert copywriter for premium marketing campaigns. Generate compelling, concise copy for a design asset.

${contextParts.length > 0 ? `CONTEXT:\n${contextParts.join('\n')}\n` : ''}
${channelGuidelines ? `CHANNEL-SPECIFIC GUIDELINES:\n${channelGuidelines}\n` : ''}
TEXT LAYERS TO FILL:
${layerDescriptions}

RULES:
1. Write copy that matches the brand tone and creative direction above.
2. Keep text SHORT and impactful — marketing copy, not paragraphs.
3. Headline layers should be 2-5 words max, punchy and memorable.
4. Description layers should be 1-2 short sentences max.
5. CTA layers should be 2-3 action words (e.g. "Shop Now", "Learn More").
6. Write in the same language as the brand name or product name. If unclear, use English.
7. Return ONLY a valid JSON object mapping layer names to their new copy text. No explanation, no markdown.

Example output format:
{"Headline": "Elevate Your Routine", "Description": "Premium skincare crafted for those who demand more.", "CTA Text": "Discover Now"}`;

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: fullPrompt },
      ],
    });

    const responseText = typeof completion.choices[0]?.message?.content === 'string'
      ? completion.choices[0].message.content
      : '';

    // Parse JSON from response (handle markdown code blocks)
    let parsed: Record<string, string> = {};
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 502 });
    }

    // Map back to layer IDs
    const results: Record<string, string> = {};
    for (const layer of textLayers) {
      if (parsed[layer.name]) {
        results[layer.id] = parsed[layer.name];
      }
    }

    return NextResponse.json({ copies: results });
  } catch (err) {
    console.error('Copy generation error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
