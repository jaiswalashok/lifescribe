'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';
import { ChevronLeft, Heart, Users, Briefcase, Star } from 'lucide-react';

const CIRCLE_TYPES = [
  { value: 'family', label: 'Family', icon: Heart },
  { value: 'friends', label: 'Close Friends', icon: Users },
  { value: 'work', label: 'Work Friends', icon: Briefcase },
  { value: 'custom', label: 'Custom', icon: Star },
];

export default function CreateCircle() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [circleType, setCircleType] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !circleType) return;
    setSaving(true);
    await base44.entities.Circle.create({ name, circle_type: circleType, privacy_setting: privacy });
    queryClient.invalidateQueries({ queryKey: ['circles'] });
    setToast('Circle created.');
    setTimeout(() => router.push(createPageUrl('Circles')), 1200);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">New Circle</h1>
      </div>

      <div className="px-6 space-y-6">
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
