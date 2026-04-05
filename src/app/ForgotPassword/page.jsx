'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email.'); return; }

    setLoading(true);
    try {
      console.log('[ForgotPassword] Sending reset email to:', email);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/CreateAccount`,
      });
      console.log('[ForgotPassword] Reset email sent successfully');
      setSent(true);
    } catch (err) {
      console.error('[ForgotPassword] Error:', err.code, err.message);
      if (err.code === 'auth/user-not-found') {
        // Show success anyway to avoid email enumeration
        setSent(true);
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3 text-center">Check your inbox</h1>
        <p className="text-sm text-gray-400 text-center leading-relaxed mb-8 max-w-xs">
          If an account exists for <span className="text-[#111111] font-medium">{email}</span>, we've sent a password reset link. Check your spam folder too.
        </p>
        <Button
          onClick={() => router.push(createPageUrl('CreateAccount'))}
          className="w-full max-w-xs bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-6 pb-8">
      <button
        onClick={() => router.back()}
        className="mb-8 p-2 -ml-2 text-gray-400 hover:text-[#111111] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Reset your password</h1>
      <p className="text-sm text-gray-400 mb-10 leading-relaxed">
        Enter the email you signed up with and we'll send you a link to reset your password.
      </p>

      {error && (
        <p className="text-sm text-red-500 mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Email address</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="you@example.com"
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300"
          />
        </div>
      </div>

      <Button
        onClick={handleSend}
        disabled={!email.trim() || loading}
        className="mt-8 w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-gray-400 mt-6">
        Remembered it?{' '}
        <button
          onClick={() => router.push(createPageUrl('CreateAccount'))}
          className="text-[#1A1A2E] font-medium underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
