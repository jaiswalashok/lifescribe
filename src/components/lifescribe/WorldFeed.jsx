'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listFeedEntries, listAllProfiles } from '@/lib/entities';
import MoodRingAvatar from './MoodRingAvatar';
import { getMoodLabel } from './constants';
import { MapPin, Briefcase, Image as ImageIcon, MessageCircle, Globe, Images } from 'lucide-react';
import PostComments from './PostComments';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';

export default function WorldFeed({ connections, currentUser }) {
  const router = useRouter();
  const [openComments, setOpenComments] = useState(null);

  const connectedUserIds = connections.map(c => c.connected_user_id);

  // Fetch feed entries using the optimized helper
  const { data: worldEntries = [], isLoading } = useQuery({
    queryKey: ['world_feed_entries', connectedUserIds.join(',')],
    queryFn: () => listFeedEntries(connectedUserIds),
  });

  // Fetch all user profiles to enrich entries with author info
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all_user_profiles'],
    queryFn: () => listAllProfiles(),
  });

  // Fetch user's own circles for capsule visibility
  const { data: myCircles = [] } = useQuery({
    queryKey: ['circles'],
    queryFn: () => base44.entities.Circle.list(),
  });

  // Fetch all capsules to surface ones shared to my circles
  const { data: allCapsules = [] } = useQuery({
    queryKey: ['moment_capsules'],
    queryFn: () => base44.entities.MomentCapsule.list(),
  });

  const myCircleIds = myCircles.map(c => c.id);
  const sharedCapsules = allCapsules.filter(cap =>
    cap.circle_ids?.some(id => myCircleIds.includes(id))
  );

  // Enrich entries with profile data
  const enrichedEntries = worldEntries.map(entry => {
    const profile = allProfiles.find(p => p.user_id === entry.user_id);
    return {
      ...entry,
      authorName: profile?.full_name || profile?.username || 'Unknown',
      authorAvatar: profile?.profile_picture_url,
      authorMood: profile?.current_mood,
      authorUsername: profile?.username,
    };
  });

  // Combine real entries + shared capsules
  const capsuleFeedItems = sharedCapsules.map(cap => ({
    ...cap,
    isCapsule: true,
    created_date: cap.created_date || cap.event_date,
  }));

  const combinedFeed = [
    ...enrichedEntries,
    ...capsuleFeedItems,
  ].sort((a, b) => {
    const dateA = a.created_date ? new Date(a.created_date) : new Date(0);
    const dateB = b.created_date ? new Date(b.created_date) : new Date(0);
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  if (combinedFeed.length === 0) {
    return (
      <div className="text-center py-16">
        <Globe className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Your world is quiet</p>
        <p className="text-xs text-gray-300">Connect with people to see their stories here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {combinedFeed.map(item => item.isCapsule ? (
        <button
          key={item.id}
          onClick={() => router.push(createPageUrl('CapsuleDetail') + `?id=${item.id}`)}
          className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#2a2a4e] rounded-xl overflow-hidden text-left"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Images className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Moment Capsule</span>
            </div>
            <p className="text-base font-bold text-white mb-1">{item.title}</p>
            {item.event_date && (
              <p className="text-xs text-white/50">{format(new Date(item.event_date), 'MMMM d, yyyy')}</p>
            )}
            {item.description && (
              <p className="text-sm text-white/70 mt-2 leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </div>
        </button>
      ) : (
        <div key={item.id} className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <button onClick={() => item.authorUsername && router.push(`/${item.authorUsername}`)}>
                <MoodRingAvatar
                  src={item.authorAvatar}
                  mood={item.authorMood}
                  size={40}
                  name={item.authorName}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={() => item.authorUsername && router.push(`/${item.authorUsername}`)}
                    className="text-sm font-semibold text-[#111111] hover:underline"
                  >
                    {item.authorName}
                  </button>
                  <span className="text-xs text-gray-300">
                    {item.created_date ? format(new Date(item.created_date), 'MMM d') : ''}
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
          {/* Entry media */}
          {item.media_urls && item.media_urls.length > 0 && (
            <div className={item.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}>
              {item.media_urls.slice(0, 4).map((url, i) => (
                item.media_types?.[i] === 'video' ? (
                  <video key={i} src={url} className="w-full h-48 object-cover" controls />
                ) : item.media_types?.[i] === 'audio' ? (
                  <div key={i} className="px-4 py-2 bg-gray-50">
                    <audio src={url} controls className="w-full" />
                  </div>
                ) : (
                  <img key={i} src={url} alt="" className="w-full h-48 object-cover" />
                )
              ))}
            </div>
          )}
          {/* Location pill */}
          {item.location && (
            <div className="px-4 pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {item.location}
              </span>
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
