'use client';
import React from 'react';
import { format } from 'date-fns';
import PillBadge from './PillBadge';
import { getMoodLabel, getSleepLabel, getMotivationLabel } from './constants';
import { Image, Mic, Film, MapPin } from 'lucide-react';

export default function JournalEntryCard({ entry, chapters, onClick }) {
  const chapter = chapters?.find(c => c.id === entry.chapter_id);
  const entryDate = entry.entry_date || entry.created_date;

  const hasImage = entry.media_types?.includes('image');
  const hasVideo = entry.media_types?.includes('video');
  const hasAudio = entry.media_types?.includes('audio');
  const firstImageUrl = hasImage ? entry.media_urls?.[entry.media_types.indexOf('image')] : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
    >
      {/* Date and chapter */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 font-medium">
          {entryDate ? format(new Date(entryDate), 'MMM d, yyyy') : ''}
        </span>
        {chapter && (
          <span className="text-xs bg-[#1A1A2E] text-white px-2 py-0.5 rounded-full font-medium">
            {chapter.name}
          </span>
        )}
      </div>

      {/* Mood/Sleep/Motivation pills */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {entry.mood && <PillBadge text={getMoodLabel(entry.mood)} />}
        {entry.sleep_quality && <PillBadge text={getSleepLabel(entry.sleep_quality)} />}
        {entry.motivation && <PillBadge text={getMotivationLabel(entry.motivation)} />}
      </div>

      {/* Text preview */}
      <p className="text-sm text-[#111111] leading-relaxed line-clamp-2 mb-2">
        {entry.content}
      </p>

      {/* Media indicators */}
      <div className="flex items-center gap-3">
        {firstImageUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            <img src={firstImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {hasVideo && !firstImageUrl && (
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Film className="w-4 h-4 text-gray-400" />
          </div>
        )}
        {hasAudio && (
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Mic className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      {entry.location && (
        <div className="flex items-center gap-1 mt-2">
          <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
          <span className="text-[10px] text-green-600 truncate">{entry.location}</span>
        </div>
      )}
    </button>
  );
}