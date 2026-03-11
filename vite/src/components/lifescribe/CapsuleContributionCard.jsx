import React, { useState } from 'react';
import MoodRingAvatar from './MoodRingAvatar';
import { format } from 'date-fns';
import { Play } from 'lucide-react';

export default function CapsuleContributionCard({ contrib }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const media = contrib.media_urls || [];
  const types = contrib.media_types || [];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <MoodRingAvatar
          src={contrib.contributor_avatar}
          mood={contrib.contributor_mood}
          size={36}
          name={contrib.contributor_name}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111111] truncate">{contrib.contributor_name}</p>
          <p className="text-xs text-gray-400">
            {contrib.created_date ? format(new Date(contrib.created_date), 'MMM d, yyyy') : ''}
          </p>
        </div>
      </div>

      {/* Media */}
      {media.length > 0 && (
        <div className="relative bg-black aspect-square w-full overflow-hidden">
          {types[activeIdx] === 'video' ? (
            <video
              src={media[activeIdx]}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={media[activeIdx]}
              alt=""
              className="w-full h-full object-cover"
            />
          )}

          {/* Multi-image dots */}
          {media.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeIdx ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      {contrib.body && (
        <div className="px-4 py-3">
          <p className="text-sm text-[#111111] leading-relaxed">
            <span className="font-semibold mr-1">{contrib.contributor_name}</span>
            {contrib.body}
          </p>
        </div>
      )}
    </div>
  );
}