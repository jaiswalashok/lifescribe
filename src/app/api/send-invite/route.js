import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { to, inviterName, inviteLink, type } = await request.json();

    if (!to || !inviteLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isFamily = type === 'family';
    const isTrustee = type === 'trustee';

    const subject = isTrustee
      ? `${inviterName} has designated you as a LifeTrustee on Lifescribe`
      : isFamily
        ? `${inviterName} has added you to their Family Circle on Lifescribe`
        : `${inviterName} invited you to join their Lifescribe circle`;

    const bodyText = isTrustee
      ? `<strong>${inviterName}</strong> has designated you as a <strong>LifeTrustee</strong> on Lifescribe. This means you have been entrusted to help preserve and pass on their memories and life story according to their wishes.`
      : `<strong>${inviterName}</strong> has invited you to ${isFamily ? 'join their family circle' : 'connect'} on Lifescribe — a private vault for life stories, memories, and meaningful moments.`;

    const ctaText = isTrustee ? 'View my responsibilities' : 'Accept Invitation';

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
      <p style="color: #111111; font-size: 16px; font-weight: 600; margin: 0 0 12px;">${isTrustee ? 'You have been designated as a LifeTrustee' : "You've been invited"}</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        ${bodyText}
      </p>
      <a href="${inviteLink}"
        style="display: inline-block; background: #1A1A2E; color: white; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-size: 14px; font-weight: 600;">
        ${ctaText}
      </a>
      <p style="color: #aaa; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
        Or copy this link: <span style="color: #555;">${inviteLink}</span>
      </p>
    </div>
    <div style="padding: 16px 32px 24px; border-top: 1px solid #f0f0f0;">
      <p style="color: #bbb; font-size: 11px; margin: 0;">You received this because ${inviterName} added your email. If this was unexpected, you can ignore this email.</p>
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
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.message || 'Email send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
