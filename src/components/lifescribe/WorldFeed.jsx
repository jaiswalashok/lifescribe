'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MoodRingAvatar from './MoodRingAvatar';
import { getMoodLabel } from './constants';
import { MapPin, Briefcase, Image as ImageIcon, MessageCircle, Globe } from 'lucide-react';
import PostComments from './PostComments';
import { format } from 'date-fns';

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

  // Fetch all journal entries
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['world_feed_entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 100),
  });

  // Fetch all user profiles to map user_id to profile data
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all_user_profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  // Get connected user IDs
  const connectedUserIds = connections.map(c => c.connected_user_id);

  // Filter entries: show user's own entries (all) OR public/connections entries from connections
  const worldEntries = allEntries.filter(entry => {
    const isOwnEntry = entry.user_id === currentUser?.user_id;
    const isFromConnection = connectedUserIds.includes(entry.user_id);
    const isPublicOrConnections = entry.audience === 'public' || entry.audience === 'connections';
    
    // Show own entries (all audiences) OR connection entries (public/connections only)
    return isOwnEntry || (isFromConnection && isPublicOrConnections);
  });

  // Enrich entries with profile data
  const enrichedEntries = worldEntries.map(entry => {
    const profile = allProfiles.find(p => p.user_id === entry.user_id);
    return {
      ...entry,
      authorName: profile?.full_name || profile?.username || 'Unknown',
      authorAvatar: profile?.profile_picture_url,
      authorMood: profile?.current_mood,
    };
  });

  // Combine mock data with real entries for a richer feed
  const combinedFeed = [
    ...MOCK_WORLD_FEED.map(mock => ({ ...mock, isMock: true })),
    ...enrichedEntries,
  ].sort((a, b) => {
    // Sort by date, newest first
    const dateA = a.created_date ? new Date(a.created_date) : new Date(a.date || 0);
    const dateB = b.created_date ? new Date(b.created_date) : new Date(b.date || 0);
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {combinedFeed.map(item => (
        <div key={item.id} className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <MoodRingAvatar 
                src={item.isMock ? item.avatar : item.authorAvatar} 
                mood={item.isMock ? item.mood : item.authorMood} 
                size={40} 
                name={item.isMock ? item.author : item.authorName} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[#111111]">
                    {item.isMock ? item.author : item.authorName}
                  </span>
                  <span className="text-xs text-gray-300">
                    {item.isMock ? item.date : (item.created_date ? format(new Date(item.created_date), 'MMM d') : '')}
                  </span>
                </div>
                {item.mood && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    {getMoodLabel(item.mood)}
                  </span>
                )}
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            </div>
          </div>
          {/* Mock data images */}
          {item.isMock && item.image && (
            <img src={item.image} alt="" className="w-full h-48 object-cover" />
          )}
          {/* Real entry media */}
          {!item.isMock && item.media_urls && item.media_urls.length > 0 && (
            <div className={item.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}>
              {item.media_urls.slice(0, 4).map((url, i) => (
                item.media_types?.[i] === 'video' ? (
                  <video key={i} src={url} className="w-full h-48 object-cover" controls />
                ) : (
                  <img key={i} src={url} alt="" className="w-full h-48 object-cover" />
                )
              ))}
            </div>
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