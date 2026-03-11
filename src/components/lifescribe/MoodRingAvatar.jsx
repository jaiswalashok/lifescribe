'use client';
import React from 'react';
import { getMoodColor } from './constants';
import { User } from 'lucide-react';

export default function MoodRingAvatar({ src, mood, size = 40, name }) {
  const ringColor = getMoodColor(mood);
  const borderWidth = mood ? 3 : 1.5;
  const outerSize = size + borderWidth * 2 + 4;

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: outerSize,
        height: outerSize,
        border: `${borderWidth}px solid ${ringColor}`,
        padding: 2,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name || ''}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-gray-100 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {name ? (
            <span className="font-semibold text-gray-500" style={{ fontSize: size * 0.38 }}>
              {name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="text-gray-400" style={{ width: size * 0.45, height: size * 0.45 }} />
          )}
        </div>
      )}
    </div>
  );
}