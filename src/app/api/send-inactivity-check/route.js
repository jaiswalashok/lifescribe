import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { to, userName, inactivityDays, confirmUrl } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Missing email address' }, { status: 400 });
    }

    const name = userName || 'there';
    const days = inactivityDays || 180;
    const baseConfirm = confirmUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lifescribe.live'}/Home`;
    const verifyLink = baseConfirm.includes('?') ? `${baseConfirm}&alive=1` : `${baseConfirm}?alive=1`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="background: #1A1A2E; padding: 32px 32px 24px;">
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Lifescribe</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 13px;">Preserve your story across generations</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #111111; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Hi ${name}, are you okay?</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        We noticed you haven't logged into Lifescribe in <strong>${days} days</strong>. Your vault and all your memories are safe.
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        If you're okay, please click the button below to let us know — this will reset your inactivity timer and keep your account active.
      </p>
      <a href="${verifyLink}"
        style="display: inline-block; background: #1A1A2E; color: white; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-size: 14px; font-weight: 600;">
        Yes, I'm okay ✓
      </a>
      <p style="color: #aaa; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
        If we don't hear from you, your designated legacy contacts will be notified after an additional grace period.
      </p>
    </div>
    <div style="padding: 16px 32px 24px; border-top: 1px solid #f0f0f0;">
      <p style="color: #bbb; font-size: 11px; margin: 0;">
        You're receiving this because you enabled Lifescribe's Dead Man's Switch feature with a ${days}-day inactivity threshold. 
        <a href="${verifyLink}" style="color: #bbb;">Manage settings</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@lifescribe.live',
        to: [to],
        subject: `${name}, are you okay? — Lifescribe check-in`,
        html,
      }),
    });

    const data = await response.json();
    console.log('[send-inactivity-check] Resend response:', response.status, JSON.stringify(data));

    if (!response.ok) {
      return NextResponse.json({ error: data?.message || 'Email send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[send-inactivity-check] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
