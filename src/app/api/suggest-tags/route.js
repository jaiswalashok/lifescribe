import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text?.trim() || text.trim().length < 20) {
      return NextResponse.json({ tags: [] });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ tags: [] });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract 3 to 5 short keyword tags from the following journal entry. Tags should be 1-2 words, lowercase, no hashtags, comma-separated. Return ONLY the comma-separated list, nothing else.\n\n"${text.slice(0, 800)}"`,
            }],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 64 },
        }),
      }
    );

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const tags = raw
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(t => t.length > 0 && t.length < 30)
      .slice(0, 5);

    return NextResponse.json({ tags });
  } catch (err) {
    console.error('[suggest-tags] Error:', err);
    return NextResponse.json({ tags: [] });
  }
}
