'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BASE_PROMPTS = [
  "You haven't written in a few days. What's been on your mind?",
  "A new week begins. What are you working toward?",
  "The month is closing. What's one thing you want to remember about it?",
  "How are you feeling today?",
  "What's one small moment from this week worth preserving?",
  "Is there something you've been meaning to write about but keep putting off?",
];

const MOOD_PROMPTS = {
  happy: [
    "You seem in good spirits — what's making today feel this way?",
    "Capture this feeling. What's brought you joy lately?",
  ],
  sad: [
    "It's okay to feel low sometimes. What's weighing on you?",
    "Writing can help. What's been hard this week?",
  ],
  anxious: [
    "Sometimes putting worries into words makes them smaller. What's on your mind?",
    "What's one thing you can control today?",
  ],
  grateful: [
    "Gratitude deserves a record. What are you thankful for right now?",
    "Name three things you're grateful for this week.",
  ],
  excited: [
    "Something good is happening — tell your future self about it!",
    "What are you most looking forward to right now?",
  ],
  calm: [
    "A quiet moment worth capturing — what's on your mind?",
    "What does peace look like for you today?",
  ],
};

export default function GuidedPromptCard({ onDismiss, onWrite, lastEntryDate, userName, currentMood }) {
  const daysSince = lastEntryDate
    ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSince < 3) return null;

  const firstName = userName ? userName.split(' ')[0] : '';
  const greeting = firstName ? `Hey ${firstName} — ` : '';

  // Pick mood-aware prompt if available
  const moodPool = currentMood && MOOD_PROMPTS[currentMood];
  let prompt;
  if (moodPool) {
    const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % moodPool.length;
    prompt = greeting + moodPool[idx];
  } else {
    const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % BASE_PROMPTS.length;
    prompt = greeting + BASE_PROMPTS[idx];
  }

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