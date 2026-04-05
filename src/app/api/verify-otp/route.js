import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    console.log(`[verify-otp] Request for email: ${email}, otp: ${otp}`);
    console.log(`[verify-otp] Store size: ${otpStore.size}, keys: [${[...otpStore.keys()].join(', ')}]`);

    if (!email || !otp) {
      console.error('[verify-otp] Missing email or otp in request body');
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const key = email.toLowerCase();
    const record = otpStore.get(key);

    console.log(`[verify-otp] Record for ${key}:`, record ? `otp=${record.otp}, expires=${new Date(record.expiresAt).toISOString()}` : 'NOT FOUND');

    if (!record) {
      return NextResponse.json({
        valid: false,
        error: 'No OTP found for this email. Please request a new code.',
        debug: `Store keys: [${[...otpStore.keys()].join(', ')}]`,
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      console.log(`[verify-otp] OTP expired for ${key}`);
      return NextResponse.json({ valid: false, error: 'Code expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString().trim()) {
      console.log(`[verify-otp] OTP mismatch for ${key}: expected ${record.otp}, got ${otp}`);
      return NextResponse.json({ valid: false, error: 'Incorrect code. Please try again.' });
    }

    otpStore.delete(key);
    console.log(`[verify-otp] OTP verified successfully for ${key}`);
    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('[verify-otp] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
