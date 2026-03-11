'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import BottomTabBar from '@/components/lifescribe/BottomTabBar';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import PillBadge from '@/components/lifescribe/PillBadge';
import JournalEntryCard from '@/components/lifescribe/JournalEntryCard';
import { getMoodLabel } from '@/components/lifescribe/constants';
import { Settings, Award, MapPin, Briefcase, Heart, Gift, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import CreatePostModal from '@/components/lifescribe/CreatePostModal';

export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('journals');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: user } = useQuery({ queryKey: ['current_user'], queryFn: () => base44.auth.me() });
  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const { data: entries = [] } = useQuery({ queryKey: ['journal_entries'], queryFn: () => base44.entities.JournalEntry.list('-created_date') });
  const { data: chapters = [] } = useQuery({ queryKey: ['chapters'], queryFn: () => base44.entities.Chapter.list() });
  const { data: capsules = [] } = useQuery({ queryKey: ['moment_capsules'], queryFn: () => base44.entities.MomentCapsule.list('-created_date') });

  const profile = profiles[0] || {};

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="bg-white px-6 pt-14 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <MoodRingAvatar src={profile.profile_picture_url || user?.profile_picture} mood={profile.current_mood} size={56} name={user?.full_name} />
            <div>
              <h1 className="text-lg font-bold text-[#1A1A2E]">{user?.full_name || 'Your Name'}</h1>
              <p className="text-sm text-gray-400">@{profile.username || 'username'}</p>
            </div>
          </div>
          <button onClick={() => router.push(createPageUrl('AppSettings'))} className="text-gray-400 hover:text-gray-600 mt-1">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {profile.current_mood && <PillBadge text={getMoodLabel(profile.current_mood)} className="mb-4" />}

        <div className="space-y-2 mb-4">
          {profile.relationship_status && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Heart className="w-3.5 h-3.5" />
              <span className="capitalize">{profile.relationship_status?.replace(/_/g, ' ')}</span>
              {profile.relationship_partner_name && profile.display_partner_name && <span>with {profile.relationship_partner_name}</span>}
            </div>
          )}
          {profile.current_location && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.current_location}</span>
            </div>
          )}
          {profile.work_position && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{profile.work_position}{profile.work_company ? ` at ${profile.work_company}` : ''}</span>
            </div>
          )}
        </div>

        <Button onClick={() => router.push(createPageUrl('Milestones'))} variant="outline" size="sm" className="rounded-full text-xs border-gray-200 text-gray-500">
          <Award className="w-3.5 h-3.5 mr-1.5" />
          Milestones
        </Button>

        <div className="flex gap-0 bg-[#F5F5F5] rounded-full p-1 mt-5">
          {['journals', 'shared', 'chapters'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${activeTab === tab ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'}`}>
              {tab === 'journals' ? 'Journals' : tab === 'shared' ? 'Shared Memories' : 'Chapters'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {activeTab === 'journals' && (
          <div className="space-y-3">
            {entries.map(entry => (
              <JournalEntryCard key={entry.id} entry={entry} chapters={chapters}
                onClick={() => router.push(createPageUrl('EntryDetail') + `?id=${entry.id}`)} />
            ))}
          </div>
        )}
        {activeTab === 'shared' && (
          <div className="space-y-3">
            {capsules.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No shared memories yet.</p>}
            {capsules.map(cap => (
              <button key={cap.id} onClick={() => router.push(createPageUrl('CapsuleDetail') + `?id=${cap.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-left flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] truncate">{cap.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {cap.event_date && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(cap.event_date), 'MMM d, yyyy')}</span>}
                    <span className="text-xs text-purple-400">{cap.contributor_count || 0} contributors</span>
                  </div>
                  {cap.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cap.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
        {activeTab === 'chapters' && (
          <div className="space-y-3">
            {chapters.map(ch => (
              <button key={ch.id} onClick={() => router.push(createPageUrl('ChapterDetail') + `?id=${ch.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-left">
                <p className="text-sm font-semibold text-[#111111]">{ch.name}</p>
                <p className="text-xs text-gray-400">{entries.filter(e => e.chapter_id === ch.id).length} entries</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar currentPage="Profile" onCreatePress={() => setShowCreateModal(true)} />
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
