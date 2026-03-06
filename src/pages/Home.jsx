import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BottomTabBar from '../components/lifescribe/BottomTabBar';
import JournalEntryCard from '../components/lifescribe/JournalEntryCard';
import WorldFeed from '../components/lifescribe/WorldFeed';
import GuidedPromptCard from '../components/lifescribe/GuidedPromptCard';
import EmptyState from '../components/lifescribe/EmptyState';
import MoodBgWrapper from '../components/lifescribe/MoodBgWrapper';
import MoodToggleBar from '../components/lifescribe/MoodToggleBar';
import CreatePostModal from '../components/lifescribe/CreatePostModal';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('journals');
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initialize profile on first visit
  useEffect(() => {
    const initProfile = async () => {
      const signupData = localStorage.getItem('lifescribe_signup');
      if (signupData) {
        const data = JSON.parse(signupData);
        const profiles = await base44.entities.UserProfile.filter({ user_id: 'current' });
        if (profiles.length === 0) {
          await base44.entities.UserProfile.create({
            user_id: 'current',
            username: data.username,
            date_of_birth: data.date_of_birth,
            profile_picture_url: data.profile_picture_url || '',
            plan_type: localStorage.getItem('lifescribe_plan') || 'free_trial',
            trial_start_date: new Date().toISOString().split('T')[0],
            language: localStorage.getItem('lifescribe_lang') || 'en',
          });
        }
        localStorage.removeItem('lifescribe_signup');
      }
    };
    initProfile();
  }, []);

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['journal_entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 50),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list(),
  });

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

  const displayName = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1).replace(/([A-Z])/g, ' $1').trim().split(' ')[0]
    : 'Your';

  const handleMoodChange = async (mood) => {
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { current_mood: mood });
      refetchProfiles();
    }
  };

  const lastEntryDate = entries.length > 0 ? entries[0].created_date : null;

  const handleWritePrompt = (prompt) => {
    navigate(createPageUrl('CreateEntry') + `?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <MoodBgWrapper mood={currentMood} className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-6 pt-14 pb-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">{displayName}'s Vault</h1>
          <MoodToggleBar currentMood={currentMood} onMoodChange={handleMoodChange} />
        </div>

        {/* Tab toggle */}
        <div className="flex gap-0 bg-[#F5F5F5] rounded-full p-1">
          <button
            onClick={() => setActiveTab('journals')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              activeTab === 'journals'
                ? 'bg-white text-[#111111] shadow-sm'
                : 'text-gray-400'
            }`}
          >
            My Journals
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              activeTab === 'world'
                ? 'bg-white text-[#111111] shadow-sm'
                : 'text-gray-400'
            }`}
          >
            My World
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {activeTab === 'journals' && (
          <>
            {!dismissedPrompt && (
              <GuidedPromptCard
                lastEntryDate={lastEntryDate}
                onDismiss={() => setDismissedPrompt(true)}
                onWrite={handleWritePrompt}
              />
            )}

            {entries.length === 0 && !entriesLoading ? (
              <EmptyState
                icon={BookOpen}
                message="Your vault is empty. Create your first memory."
                ctaText="Write your first entry"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    chapters={chapters}
                    onClick={() => navigate(createPageUrl('EntryDetail') + `?id=${entry.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'world' && (
          <WorldFeed connections={connections} currentUser={profile} />
        )}
      </div>

      <BottomTabBar currentPage="Home" onCreatePress={() => setShowCreateModal(true)} />
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </MoodBgWrapper>
  );
}