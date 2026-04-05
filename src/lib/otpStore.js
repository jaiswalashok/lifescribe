/**
 * Shared OTP store using globalThis so it persists across
 * Next.js hot-reloads and is shared between /api/send-otp and /api/verify-otp
 * within the same Node.js process.
 *
 * NOTE: In production serverless (Vercel), each invocation may run in a fresh
 * isolate. For production, replace this with a Firestore-backed store.
 * For local dev and preview, this works perfectly.
 */
const store = globalThis.__lifescribe_otp_store ??
  (globalThis.__lifescribe_otp_store = new Map());

export const otpStore = store;
