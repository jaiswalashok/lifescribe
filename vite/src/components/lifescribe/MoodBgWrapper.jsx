import React from 'react';
import { MOOD_COLORS, DEFAULT_MOOD_COLOR } from './constants';

// Pastel/tinted background color per mood (very subtle)
const MOOD_BG = {
  very_happy: '#FFFBEB',
  happy: '#F0FDF4',
  normal: '#FAFAFA',
  calm: '#EFF6FF',
  loving: '#FFF1F5',
  energised: '#FFF7ED',
  motivated: '#F5F3FF',
  tired: '#F1F5F9',
  sad: '#EFF6FF',
  very_sad: '#EEF2FF',
  unwell: '#FDF4FF',
  angry: '#FFF5F5',
  very_glad: '#F0FDF4',
  upset: '#FFF5F5',
};

export function getMoodBg(mood) {
  return mood ? (MOOD_BG[mood] || '#FAFAFA') : '#FAFAFA';
}

export default function MoodBgWrapper({ mood, children, className = '' }) {
  const bg = getMoodBg(mood);
  return (
    <div
      className={className}
      style={{ backgroundColor: bg, transition: 'background-color 0.6s ease' }}
    >
      {children}
    </div>
  );
}