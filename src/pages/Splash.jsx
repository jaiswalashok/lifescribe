import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Splash() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex flex-col items-center justify-center px-6 py-12">
      {/* Content */}
      <div className="text-center flex-1 flex flex-col justify-center max-w-md">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-3">Lifescribe</h1>
        <p className="text-lg text-white/60 mb-12">Your memories, preserved forever.</p>

        {/* CTA Button */}
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-white text-[#1A1A2E] hover:bg-white/90 rounded-full h-12 text-base font-semibold mb-4 disabled:opacity-70"
        >
          {isLoading ? 'Loading...' : 'Get Started'}
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-white/40 text-center">
        No ads. Your data is never sold.
      </p>
    </div>
  );
}