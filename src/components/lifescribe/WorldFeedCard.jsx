'use client';
import React from 'react';
import { format } from 'date-fns';
import MoodRingAvatar from './MoodRingAvatar';
import PillBadge from './PillBadge';
import { getMoodLabel } from './constants';

export default function WorldFeedCard({ entry, authorName, authorAvatar, authorMood, onClick }) {
  const entryDate = entry.entry_date || entry.created_date;

  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <MoodRingAvatar src={authorAvatar} mood={authorMood} size={40} name={authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[#111111]">{authorName}</span>
            <span className="text-xs text-gray-300">
              {entryDate ? format(new Date(entryDate), 'MMM d') : ''}
            </span>
          </div>
          {entry.mood && <PillBadge text={getMoodLabel(entry.mood)} className="mb-1.5" />}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{entry.content}</p>
        </div>
      </div>
    </button>
  );
}