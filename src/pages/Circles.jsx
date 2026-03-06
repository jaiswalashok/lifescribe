import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import BottomTabBar from '../components/lifescribe/BottomTabBar';
import EmptyState from '../components/lifescribe/EmptyState';
import MoodRingAvatar from '../components/lifescribe/MoodRingAvatar';
import ConnectionProfile from '../components/lifescribe/ConnectionProfile';
import { AnimatePresence } from 'framer-motion';
import { Users, Plus, Cake, MapPin, Briefcase, Smile, Bell } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import LocationsTab from '../components/lifescribe/LocationsTab';
import CreatePostModal from '../components/lifescribe/CreatePostModal';
import ConnectionRequestsSheet from '../components/lifescribe/ConnectionRequestsSheet';

const KEY_EVENT_TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: Cake },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'mood', label: 'Mood', icon: Smile },
];

// Mock location/work/mood data for key events
const LOCATION_UPDATES = [
  { name: 'Farid Azman', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop', mood: 'energised', location: 'Tokyo, Japan', time: '2 days ago' },
  { name: 'Zara Malik', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop', mood: 'calm', location: 'Georgetown, Penang', time: '4 days ago' },
];
const WORK_UPDATES = [
  { name: 'Daniel Tan', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', mood: 'motivated', update: 'Started as Head Coach at FitLife KL', time: '1 week ago' },
  { name: 'Amira Yusof', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop', mood: 'calm', update: 'Promoted to Senior Architect', time: '2 weeks ago' },
];
const MOOD_UPDATES = [
  { name: 'Jane Chia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', mood: 'loving', time: 'Today' },
  { name: 'Farid Azman', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop', mood: 'energised', time: '1 day ago' },
  { name: 'Nurul Hashim', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop', mood: 'happy', time: '2 days ago' },
];

// Connections that posted recently (mock "unread" — last 2 days)
const RECENT_POSTERS = ['wf1', 'wf2']; // post IDs — we map by author name for demo
const RECENT_AUTHORS = ['Jane Chia', 'Farid Azman'];

export default function Circles() {
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState('upcoming');
  const [selectedConn, setSelectedConn] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const reqs = await base44.entities.FamilyRelationship.filter({ status: 'pending' });
      return reqs.length;
    },
  });

  const { data: circles = [] } = useQuery({
    queryKey: ['circles'],
    queryFn: () => base44.entities.Circle.list(),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.Connection.list(),
  });

  const getCircleConnections = (circleId) => connections.filter(c => c.circle_id === circleId);
  const unclassified = connections.filter(c => !c.circle_id);

  // Build upcoming birthdays/anniversaries from milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const upcomingDays = parseInt(localStorage.getItem('circles_upcoming_days') || '30', 10);
  const today = new Date();
  const upcomingEvents = milestones
    .map(m => {
      const d = new Date(m.milestone_date);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const days = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
      return { ...m, daysUntil: days, nextDate: next };
    })
    .filter(m => m.daysUntil <= upcomingDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">

      {/* Header */}
      <div className="bg-white px-6 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Circles</h1>
          <button
            onClick={() => setShowRequests(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F5]"
          >
            <Bell className="w-5 h-5 text-[#111111]" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Key Events bar */}
        <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-1">
          {KEY_EVENT_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEvent(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeEvent === tab.id
                    ? 'bg-[#1A1A2E] text-white'
                    : 'bg-[#F5F5F5] text-gray-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Events Content */}
      <div className="px-4 pt-3 pb-2">
        <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {activeEvent === 'upcoming' && (
            upcomingEvents.length === 0
              ? <p className="text-xs text-gray-400">No upcoming events in the next {upcomingDays} days.</p>
              : <div className="space-y-3">
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                        <Cake className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111111] truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">
                          {ev.daysUntil === 0 ? 'Today!' : ev.daysUntil === 1 ? 'Tomorrow' : `In ${ev.daysUntil} days`}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ev.type}</span>
                    </div>
                  ))}
                </div>
          )}
          {activeEvent === 'locations' && <LocationsTab />}
          {activeEvent === 'work' && (
            <div className="space-y-3">
              {WORK_UPDATES.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <MoodRingAvatar src={u.avatar} mood={u.mood} size={36} name={u.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111111]">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.update} · {u.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeEvent === 'mood' && (
            <div className="space-y-3">
              {MOOD_UPDATES.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <MoodRingAvatar src={u.avatar} mood={u.mood} size={36} name={u.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111111]">{u.name}</p>
                    <p className="text-xs text-gray-400">Feeling {u.mood.replace('_', ' ')} · {u.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Circles grid */}
      <div className="px-4 pt-2">
        {circles.length === 0 && unclassified.length === 0 ? (
          <EmptyState
            icon={Users}
            message="Invite the people who matter. They will only see what you choose to share."
            ctaText="Create a circle"
            onAction={() => navigate(createPageUrl('CreateCircle'))}
          />
        ) : (
          <>
            {/* Unclassified */}
            {unclassified.length > 0 && (
              <button
                onClick={() => navigate(createPageUrl('CircleDetail') + '?type=unclassified')}
                className="w-full bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] mb-3 text-left"
              >
                <h3 className="text-sm font-semibold text-[#111111] mb-1">Unclassified</h3>
                <p className="text-xs text-gray-400">{unclassified.length} connections</p>
                <div className="flex -space-x-2 mt-2">
                  {unclassified.slice(0, 3).map((conn, i) => {
                    const hasUpdate = RECENT_AUTHORS.includes(conn.connected_user_name);
                    return (
                      <div key={i} className="relative">
                        <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={28} name={conn.connected_user_name} />
                        {hasUpdate && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white" />}
                      </div>
                    );
                  })}
                  {unclassified.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium border-2 border-white">
                      +{unclassified.length - 3}
                    </div>
                  )}
                </div>
              </button>
            )}

            {/* Circle cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {circles.map(circle => {
                const members = getCircleConnections(circle.id);
                return (
                  <div key={circle.id} className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <button
                      onClick={() => navigate(createPageUrl('CircleDetail') + `?id=${circle.id}`)}
                      className="text-left w-full"
                    >
                      <h3 className="text-sm font-semibold text-[#111111] mb-1 truncate">{circle.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{members.length} connections</p>
                    </button>
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((conn, i) => {
                        const hasUpdate = RECENT_AUTHORS.includes(conn.connected_user_name);
                        return (
                          <button key={i} onClick={() => setSelectedConn(conn)} className="relative">
                            <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={24} name={conn.connected_user_name} />
                            {hasUpdate && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white" />
                            )}
                          </button>
                        );
                      })}
                      {members.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium border-2 border-white">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => navigate(createPageUrl('CreateCircle'))}
              className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium mt-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new circle
            </Button>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedConn && (
          <ConnectionProfile connection={selectedConn} onClose={() => setSelectedConn(null)} />
        )}
      </AnimatePresence>

      <BottomTabBar currentPage="Circles" onCreatePress={() => setShowCreateModal(true)} />
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <ConnectionRequestsSheet open={showRequests} onClose={() => setShowRequests(false)} />
    </div>
  );
}