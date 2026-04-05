import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { entries } = await request.json();

    if (!entries?.length) {
      return NextResponse.json({ insights: null });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insights: null });
    }

    // Build a condensed summary of the entries for analysis
    const summary = entries
      .slice(0, 40) // cap at 40 entries to stay within token limits
      .map((e, i) => `[${e.entry_date || 'unknown date'}] mood:${e.mood || 'unset'} — ${(e.content || '').slice(0, 200)}`)
      .join('\n');

    const prompt = `You are an insightful life coach analyzing someone's private journal entries. Based on the entries below, generate a warm, thoughtful, and personal set of insights in JSON format with these exact keys:

{
  "summary": "2-3 sentence narrative overview of their emotional and life journey",
  "top_themes": ["theme1", "theme2", "theme3"],
  "mood_pattern": "1-2 sentence observation about their emotional patterns",
  "most_active_period": "observation about when they write most (time, frequency pattern)",
  "growth_areas": ["area1", "area2"],
  "encouragement": "1 warm, specific, personalized sentence of encouragement"
}

Return ONLY valid JSON. Be specific, warm, and insightful — not generic.

Journal entries:
${summary}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const insights = JSON.parse(cleaned);

    return NextResponse.json({ insights });
  } catch (err) {
    console.error('[life-insights] Error:', err);
    return NextResponse.json({ insights: null });
  }
}
