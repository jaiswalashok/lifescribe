'use client';
import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { BookOpen, Layers, Users, User, Plus } from 'lucide-react';

const tabs = [
  { name: 'Home', label: 'Journals', icon: BookOpen },
  { name: 'Chapters', label: 'Chapters', icon: Layers },
  { name: '__create__', label: '', icon: Plus },
  { name: 'Circles', label: 'Circles', icon: Users },
  { name: 'Profile', label: 'Profile', icon: User },
];

export default function BottomTabBar({ currentPage, onCreatePress }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          if (tab.name === '__create__') {
            return (
              <button
                key="create"
                onClick={onCreatePress}
                className="flex items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 bg-[#111111] rounded-full flex items-center justify-center shadow-lg shadow-black/20">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </button>
            );
          }

          const isActive = currentPage === tab.name;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={createPageUrl(tab.name)}
              className="flex flex-col items-center gap-1 min-w-[56px]"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#111111]' : 'text-gray-300'
                  }`}
                  fill={isActive ? '#111111' : 'none'}
                />
              </div>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-[#111111]' : 'text-gray-300'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-5 h-0.5 bg-[#111111] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}