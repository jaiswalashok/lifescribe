'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PROMPTS = [
  "You haven't written in a few days. What's been on your mind?",
  "A new week begins. What are you working toward?",
  "The month is closing. What's one thing you want to remember about it?",
  "How are you feeling today?",
];

export default function GuidedPromptCard({ onDismiss, onWrite, lastEntryDate }) {
  // Show if no entry in 3+ days
  const daysSince = lastEntryDate
    ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSince < 3) return null;

  const promptIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % PROMPTS.length;
  const prompt = PROMPTS[promptIndex];

  return (
    <div className="bg-[#F5F5F5] rounded-xl p-4 mb-4 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm text-gray-500 leading-relaxed pr-6 mb-3">{prompt}</p>
      <Button
        onClick={() => onWrite(prompt)}
        size="sm"
        className="bg-[#111111] text-white hover:bg-[#333] rounded-full text-xs h-8 px-4"
      >
        Write now
      </Button>
    </div>
  );
}