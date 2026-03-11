'use client';
import React, { useState } from 'react';
import MoodRingAvatar from './MoodRingAvatar';
import { getMoodLabel } from './constants';
import { MapPin, Briefcase, Image as ImageIcon, MessageCircle } from 'lucide-react';
import PostComments from './PostComments';

const MOCK_WORLD_FEED = [
  {
    id: 'wf1',
    author: 'Jane Chia',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    mood: 'loving',
    date: 'Mar 2',
    content: 'Spent the afternoon baking. The house smells like cinnamon and nostalgia. Some days are just perfectly ordinary, and that\'s enough.',
    image: 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600&h=400&fit=crop',
    type: 'entry',
  },
  {
    id: 'wf2',
    author: 'Farid Azman',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
    mood: 'energised',
    date: 'Mar 1',
    content: 'Just landed in Tokyo. First time here. The city is overwhelming in the best way possible.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    type: 'entry',
  },
  {
    id: 'wf3',
    author: 'Nurul Hashim',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
    mood: 'happy',
    date: 'Feb 28',
    content: 'Baked a whole spread for Eid preparation. The kitchen was chaos but the best kind. Ridhwan kept sneaking cookies.',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&h=400&fit=crop',
    type: 'entry',
  },
  {
    id: 'wf4',
    author: 'Daniel Tan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    mood: 'motivated',
    date: 'Feb 27',
    content: 'Hit a new personal record at the gym today. 18 months of consistency finally showing. If you told me a year ago I\'d be here, I wouldn\'t have believed you.',
    type: 'entry',
  },
  {
    id: 'wf5',
    author: 'Zara Malik',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop',
    mood: 'calm',
    date: 'Feb 26',
    content: 'Read an entire book in one sitting. It rained all day. Sometimes the universe just aligns perfectly.',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
    type: 'entry',
  },
];

export default function WorldFeed({ connections, currentUser }) {
  const [openComments, setOpenComments] = useState(null);

  return (
    <div className="space-y-3">
      {MOCK_WORLD_FEED.map(item => (
        <div key={item.id} className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <MoodRingAvatar src={item.avatar} mood={item.mood} size={40} name={item.author} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[#111111]">{item.author}</span>
                  <span className="text-xs text-gray-300">{item.date}</span>
                </div>
                {item.mood && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    {getMoodLabel(item.mood)}
                  </span>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
              </div>
            </div>
          </div>
          {item.image && (
            <img src={item.image} alt="" className="w-full h-48 object-cover" />
          )}
          {/* Comment toggle */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setOpenComments(openComments === item.id ? null : item.id)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Comment
            </button>
          </div>
          {openComments === item.id && (
            <PostComments
              postId={item.id}
              currentUserName={currentUser?.username || 'You'}
              currentUserMood={currentUser?.current_mood}
            />
          )}
        </div>
      ))}
    </div>
  );
}