'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Toast from '@/components/lifescribe/Toast';
import { ChevronLeft } from 'lucide-react';
import VoiceInput from '@/components/lifescribe/VoiceInput';
import { MILESTONE_TYPES } from '@/components/lifescribe/constants';

const REMINDER_OPTIONS = [
  { value: 0, label: 'On the day' },
  { value: 1, label: '1 day before' },
  { value: 7, label: '1 week before' },
  { value: 30, label: '1 month before' },
];

export default function AddMilestone() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [description, setDescription] = useState('');
  const [reminders, setReminders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const toggleReminder = (val) => setReminders(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handleSave = async () => {
    if (!title.trim() || !milestoneDate || !type) return;
    setSaving(true);
    await base44.entities.Milestone.create({ title, milestone_date: milestoneDate, type, description: description || undefined, reminder_days_before: reminders.length > 0 ? reminders : undefined });
    queryClient.invalidateQueries({ queryKey: ['milestones'] });
    setToast('Milestone saved.');
    setTimeout(() => router.push(createPageUrl('Milestones')), 1200);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Add Milestone</h1>
      </div>

      <div className="px-6 space-y-5">
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Name this milestone *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What milestone is this?"
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-2 block">Type *</Label>
          <div className="grid grid-cols-2 gap-2">
            {MILESTONE_TYPES.map(mt => (
              <button key={mt.value} onClick={() => setType(mt.value)}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${type === mt.value ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
                <span className="text-xl">{mt.emoji}</span>
                <span className="text-xs font-medium">{mt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">When did this happen? *</Label>
          <Input type="date" value={milestoneDate} onChange={e => setMilestoneDate(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-medium text-gray-500">Description</Label>
            <VoiceInput onTranscript={(text) => setDescription(prev => prev ? prev + ' ' + text : text)} />
          </div>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell the story..."
            className="bg-[#F5F5F5] border-0 rounded-xl text-[#111111] placeholder:text-gray-300 min-h-[80px]" />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-2 block">Remind me</Label>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => toggleReminder(opt.value)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${reminders.includes(opt.value) ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!title.trim() || !milestoneDate || !type || saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40">
          {saving ? 'Saving...' : 'Save milestone'}
        </Button>
      </div>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
