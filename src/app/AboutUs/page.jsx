'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function AboutUs() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">About Us</h1>
      </div>
      <div className="px-6 flex flex-col items-center pt-12">
        <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Lifescribe</h2>
        <p className="text-sm text-gray-500 mb-2 text-center leading-relaxed">Lifescribe preserves life stories across generations.</p>
        <p className="text-sm text-gray-500 mb-2 text-center leading-relaxed">We charge for storage and features — never for your data.</p>
        <p className="text-sm text-gray-400 mb-8 text-center">Founded 2023. Private company. Built for the long term.</p>
        <div className="space-y-3 text-center">
          <p className="text-sm text-gray-500">support@lifescribe.app</p>
          <p className="text-sm text-gray-500">contact@lifescribe.app</p>
          <p className="text-sm text-[#1A1A2E] font-medium">www.lifescribe.app</p>
        </div>
      </div>
    </div>
  );
}
