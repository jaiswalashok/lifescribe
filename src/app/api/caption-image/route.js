import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ caption: '' });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ caption: '' });
    }

    // Fetch image as base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return NextResponse.json({ caption: '' });
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: { mime_type: mimeType, data: base64 },
              },
              {
                text: 'Write a short, warm, personal journal caption for this photo. 1-2 sentences. First person. Evocative and thoughtful. Return ONLY the caption text.',
              },
            ],
          }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 128 },
        }),
      }
    );

    const data = await res.json();
    const caption = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return NextResponse.json({ caption });
  } catch (err) {
    console.error('[caption-image] Error:', err);
    return NextResponse.json({ caption: '' });
  }
}
