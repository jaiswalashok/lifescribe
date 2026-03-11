import React from 'react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ message, ctaText, onAction, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
          <Icon className="w-7 h-7 text-gray-300" />
        </div>
      )}
      <p className="text-gray-400 text-sm leading-relaxed max-w-[260px] mb-6">{message}</p>
      {ctaText && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#111111] text-white hover:bg-[#333] rounded-full px-6 h-11 text-sm font-medium"
        >
          {ctaText}
        </Button>
      )}
    </div>
  );
}