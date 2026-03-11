'use client';
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import BottomTabBar from '@/components/lifescribe/BottomTabBar';
import WorldFeed from '@/components/lifescribe/WorldFeed';
import MoodBgWrapper from '@/components/lifescribe/MoodBgWrapper';
import MoodToggleBar from '@/components/lifescribe/MoodToggleBar';
import CreatePostModal from '@/components/lifescribe/CreatePostModal';
import { Globe } from 'lucide-react';

export default function WorldPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.Connection.list(),
  });

  const { data: profiles = [], refetch: refetchProfiles } = useQuery({
    queryKey: ['user_profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profile = profiles[0];
  const currentMood = profile?.current_mood;

  const handleMoodChange = async (mood) => {
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { current_mood: mood });
      refetchProfiles();
    }
  };

  return (
    <MoodBgWrapper mood={currentMood} className="min-h-screen pb-24">
      <div className="bg-white/80 backdrop-blur-sm px-6 pt-14 pb-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1A1A2E]" />
            <h1 className="text-2xl font-bold text-[#1A1A2E]">World</h1>
          </div>
          <MoodToggleBar currentMood={currentMood} onMoodChange={handleMoodChange} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Your family & friends feed</p>
      </div>

      <div className="px-4 pt-4">
        {connections.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400 mb-1">Your world is quiet right now.</p>
            <p className="text-xs text-gray-300">Add family and friends in Circles to see their stories here.</p>
          </div>
        ) : (
          <WorldFeed connections={connections} currentUser={profile} />
        )}
      </div>

      <BottomTabBar currentPage="world" onCreatePress={() => setShowCreateModal(true)} />
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </MoodBgWrapper>
  );
}
