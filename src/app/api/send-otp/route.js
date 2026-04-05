import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      console.error('[send-otp] Missing email in request body');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const key = email.toLowerCase();

    otpStore.set(key, { otp, expiresAt });
    console.log(`[send-otp] OTP generated for ${key}: ${otp} (expires ${new Date(expiresAt).toISOString()})`);
    console.log(`[send-otp] Store size after set: ${otpStore.size}, keys: [${[...otpStore.keys()].join(', ')}]`);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 40px 0;">
  <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="background: #1A1A2E; padding: 28px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">Lifescribe</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Verify your email address</p>
    </div>
    <div style="padding: 32px; text-align: center;">
      <p style="color: #555; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        Enter this code to verify your email. It expires in 10 minutes.
      </p>
      <div style="display: inline-block; background: #F5F5F5; border-radius: 12px; padding: 16px 32px; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1A1A2E;">${otp}</span>
      </div>
      <p style="color: #aaa; font-size: 12px; margin: 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@lifescribe.live';
    console.log(`[send-otp] Sending via Resend from: ${fromEmail} to: ${email}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `${otp} is your Lifescribe verification code`,
        html,
      }),
    });

    const data = await response.json();
    console.log(`[send-otp] Resend response status: ${response.status}`, JSON.stringify(data));

    if (!response.ok) {
      console.error('[send-otp] Resend error:', data);
      return NextResponse.json({ error: data?.message || 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ success: true, otpSent: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
