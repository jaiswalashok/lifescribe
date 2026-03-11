'use client';
import React, { useState } from 'react';
import { MOOD_OPTIONS, getMoodLabel, MOOD_COLORS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

export default function MoodToggleBar({ currentMood, onMoodChange }) {
  const [open, setOpen] = useState(false);

  const moodColor = currentMood ? (MOOD_COLORS[currentMood] || '#E0E0E0') : '#E0E0E0';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
        style={{
          backgroundColor: currentMood ? moodColor + '30' : '#F5F5F5',
          color: currentMood ? moodColor : '#9CA3AF',
          border: `1.5px solid ${currentMood ? moodColor : 'transparent'}`,
        }}
      >
        <Smile className="w-4 h-4" />
        <span className="text-xs">
          {currentMood ? getMoodLabel(currentMood) : 'How are you feeling?'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-10 left-0 z-30 bg-white rounded-2xl shadow-xl p-3 w-72 grid grid-cols-4 gap-2"
          >
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onMoodChange(opt.value); setOpen(false); }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  currentMood === opt.value ? 'bg-[#1A1A2E] text-white' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[9px] font-medium mt-0.5 leading-tight text-center">{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}