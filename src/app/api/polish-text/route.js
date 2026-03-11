import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text?.trim()) {
      return NextResponse.json({ polished: text || '' });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ polished: text });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful writing assistant. Clean up the following voice transcription: fix grammar, punctuation, and flow while preserving the original meaning and tone exactly. Return only the cleaned text, nothing else.\n\n"${text}"`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json();
    const polished = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return NextResponse.json({ polished });
  } catch (error) {
    console.error('Gemini API error:', error);
    const { text } = await request.json();
    return NextResponse.json({ polished: text || '' });
  }
}
