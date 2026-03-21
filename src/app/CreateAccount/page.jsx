'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CreateAccount() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const formatFirebaseError = (err) => {
    const code = err?.code || '';
    if (code.includes('invalid-email')) return 'Please enter a valid email address.';
    if (code.includes('email-already-in-use')) return 'An account with this email already exists. Try signing in instead.';
    if (code.includes('weak-password')) return 'Password is too weak. Please use at least 6 characters.';
    if (code.includes('network-request-failed')) return 'Network error. Please check your connection and try again.';
    return err.message || 'Failed to create account. Please try again.';
  };

  const validateForm = () => {
    if (!form.email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.password) return 'Please enter a password.';
    if (form.password.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await base44.auth.registerWithEmail(form.email, form.password);
      localStorage.setItem('lifescribe_signup', JSON.stringify(form));
      router.push(createPageUrl('EmailVerify') + `?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(formatFirebaseError(err));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await base44.auth.loginWithGoogle();
      router.push(createPageUrl('Home'));
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const allFilled = form.email && form.password;

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-6 pb-8">
      <button
        onClick={() => router.push(createPageUrl('LanguageSelect'))}
        className="mb-8 p-2 -ml-2 text-gray-400 hover:text-[#111111] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Start preserving your story</h1>
      <p className="text-sm text-gray-400 mb-12">3 months free. No credit card required.</p>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="Create a password"
              className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 px-1">Must be at least 6 characters</p>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!allFilled || loading}
        className="mt-8 w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full h-12 rounded-full border border-gray-200 text-[#1A1A2E] font-medium text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-[10px] text-gray-300 mt-4">End-to-end encrypted. You own everything you create.</p>

      <p className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{' '}
        <button onClick={() => router.push(createPageUrl('Home'))} className="text-[#1A1A2E] font-medium underline">
          Sign in
        </button>
      </p>
    </div>
  );
}
