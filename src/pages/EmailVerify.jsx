import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EmailVerify() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || 'your email';

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

    // Auto-advance when all filled (simulate success)
    if (index === 5 && value) {
      const code = [...newDigits.slice(0, 5), value].join('');
      if (code.length === 6) {
        setTimeout(() => {
          navigate(createPageUrl('Paywall'));
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
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Verify your email</h1>
      <p className="text-sm text-gray-400 mb-12 leading-relaxed">
        We sent a 6-digit code to <span className="text-[#111111] font-medium">{email}</span>
      </p>

      {/* Code input */}
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
            className="w-12 h-14 text-center text-xl font-semibold bg-[#F5F5F5] rounded-xl border-0 
                       focus:ring-2 focus:ring-[#1A1A2E] focus:bg-white text-[#111111] outline-none transition-all"
          />
        ))}
      </div>

      {/* Resend */}
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