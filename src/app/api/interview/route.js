import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { history, action } = await request.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: '' });
    }

    // history: [{ role: 'assistant'|'user', text: string }]
    const historyText = (history || [])
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'You'}: ${m.text}`)
      .join('\n');

    let prompt;
    if (action === 'open') {
      prompt = `You are a warm, curious life coach helping someone journal. Ask ONE short, open-ended opening question to help them reflect on their day or something meaningful to them. Be conversational and empathetic. Return ONLY the question, no preamble.`;
    } else if (action === 'followup') {
      prompt = `You are helping someone journal through gentle conversation. Here is the conversation so far:\n\n${historyText}\n\nBased on what they've shared, ask ONE thoughtful follow-up question that helps them go deeper. Keep it warm and personal. Return ONLY the question.`;
    } else if (action === 'generate') {
      prompt = `Based on this journal conversation, write a beautiful, personal journal entry in first person. Preserve the emotion and details. Make it flow naturally as a single diary-style entry. Do NOT include any preamble like "Here is your entry".\n\n${historyText}`;
    } else {
      return NextResponse.json({ text: '' });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: action === 'generate' ? 0.5 : 0.7,
            maxOutputTokens: action === 'generate' ? 512 : 128,
          },
        }),
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[interview] Error:', err);
    return NextResponse.json({ text: '' });
  }
}
