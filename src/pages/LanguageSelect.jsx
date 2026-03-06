import React from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function LanguageSelect() {
  const navigate = useNavigate();

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
    { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'th', label: 'Thai', native: 'ไทย' },
    { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  ];

  const handleSelect = (langCode) => {
    localStorage.setItem('lifescribe_lang', langCode);
    navigate(createPageUrl('CreateAccount'));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-6 pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate(createPageUrl('Splash'))}
        className="mb-8 p-2 -ml-2 text-gray-400 hover:text-[#111111] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Wordmark */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A2E]">Lifescribe</h1>
      </div>

      {/* Heading */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-[#111111] mb-2">Choose your language</h2>
        <p className="text-sm text-gray-400">Select your preferred language to continue</p>
      </div>

      {/* Language list */}
      <div className="flex flex-col gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="flex items-center justify-between w-full py-4 px-4 rounded-xl hover:bg-gray-50 transition-colors text-left group"
          >
            <span className="text-[#111111] font-medium text-base">{lang.native}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Spacer to push content up */}
      <div className="flex-1" />

      {/* Footer */}
      <p className="text-center text-xs text-gray-300 mt-12">
        Lifescribe — Your story, preserved.
      </p>
    </div>
  );
}