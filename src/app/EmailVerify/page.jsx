'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';

function EmailVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const code = [...newDigits.slice(0, 5), value].join('');
      if (code.length === 6) {
        setTimeout(() => {
          router.push(createPageUrl('Paywall'));
        }, 500);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-20 pb-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Verify your email</h1>
      <p className="text-sm text-gray-400 mb-12 leading-relaxed">
        We sent a 6-digit code to <span className="text-[#111111] font-medium">{email}</span>
      </p>

      <div className="flex justify-center gap-3 mb-8">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigitChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-xl font-semibold bg-[#F5F5F5] rounded-xl border-0 focus:ring-2 focus:ring-[#1A1A2E] focus:bg-white text-[#111111] outline-none transition-all"
          />
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        Didn't receive the code?{' '}
        <button className="text-[#1A1A2E] font-medium underline">Resend</button>
      </p>

      <div className="flex-1" />

      <p className="text-center text-xs text-gray-300">
        Enter any 6 digits to continue
      </p>
    </div>
  );
}

export default function EmailVerify() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <EmailVerifyContent />
    </Suspense>
  );
}
