import React from 'react';

export default function PillBadge({ text, className = '' }) {
  if (!text) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
      {text}
    </span>
  );
}