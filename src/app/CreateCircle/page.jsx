'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, ChevronLeft, Heart, Users, Briefcase, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';

const CIRCLE_TYPES = [
  { value: 'family', label: 'Family', icon: Heart },
  { value: 'friends', label: 'Close Friends', icon: Users },
  { value: 'work', label: 'Work Friends', icon: Briefcase },
  { value: 'custom', label: 'Custom', icon: Star },
];

const FREE_CIRCLE_LIMIT = 1;

export default function CreateCircle() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [circleType, setCircleType] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const { data: circles = [] } = useQuery({ queryKey: ['circles'], queryFn: () => base44.entities.Circle.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const plan = profiles[0]?.plan_type || 'free';
  const isPaid = plan === 'legacy_plus' || plan === 'family_legacy';
  const atLimit = !isPaid && circles.length >= FREE_CIRCLE_LIMIT;

  const [error, setError] = useState('');

  if (atLimit) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-lg font-semibold text-[#111111] ml-3">New Circle</h1>
        </div>
        <div className="px-6 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] mb-2">Circle limit reached</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Free accounts can have {FREE_CIRCLE_LIMIT} circle.<br />Upgrade to create unlimited circles.
          </p>
          <Button onClick={() => router.push(createPageUrl('Paywall'))} className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 px-8">
            Upgrade Plan
          </Button>
          <button onClick={() => router.back()} className="mt-3 text-sm text-gray-400">Go back</button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter a circle name.');
      return;
    }
    if (!circleType) {
      setError('Please select a circle type.');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Circle.create({ name, circle_type: circleType, privacy_setting: privacy });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      setToast('Circle created.');
      setTimeout(() => router.push(createPageUrl('Circles')), 1200);
    } catch (err) {
      console.error('Circle creation error:', err);
      setError(err.message?.includes('permission')
        ? 'Unable to create circle. Please try signing out and back in.'
        : err.message || 'Failed to create circle. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">New Circle</h1>
      </div>

      <div className="px-6 space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Circle Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name this circle"
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-2 block">Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {CIRCLE_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button key={type.value} onClick={() => setCircleType(type.value)}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${circleType === type.value ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Privacy</Label>
          <div className="flex bg-[#F5F5F5] rounded-full p-1">
            {['private', 'connections'].map(p => (
              <button key={p} onClick={() => setPrivacy(p)}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${privacy === p ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!name.trim() || !circleType || saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
