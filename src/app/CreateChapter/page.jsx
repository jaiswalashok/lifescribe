'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, ChevronLeft, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Toast from '@/components/lifescribe/Toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VoiceInput from '@/components/lifescribe/VoiceInput';

const FREE_CHAPTER_LIMIT = 3;

const CHAPTER_TEMPLATES = [
  { label: 'Childhood', name: 'Childhood', description: 'Memories, milestones and stories from my early years.' },
  { label: 'Education', name: 'Education', description: 'School, university, and lifelong learning.' },
  { label: 'Career', name: 'Career', description: 'Work milestones, jobs, and professional journey.' },
  { label: 'Relationships', name: 'Relationships', description: 'Friendships, love, and people who shaped me.' },
  { label: 'Travel', name: 'Travel', description: 'Adventures, places visited, and experiences abroad.' },
  { label: 'Health', name: 'Health', description: 'Health journeys, challenges overcome, and wellness.' },
  { label: 'Family', name: 'Family Life', description: 'Parenting, marriage, and family milestones.' },
  { label: 'Gratitude', name: 'Gratitude Journal', description: 'Things I am grateful for every day.' },
];

export default function CreateChapter() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  const { data: chapters = [] } = useQuery({ queryKey: ['chapters'], queryFn: () => base44.entities.Chapter.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const plan = profiles[0]?.plan_type || 'free';
  const isPaid = plan === 'legacy_plus' || plan === 'family_legacy';
  const atLimit = !isPaid && chapters.length >= FREE_CHAPTER_LIMIT;
  const fileInputRef = useRef();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `chapter_covers/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCoverUrl(url);
    } catch (err) {
      setToast('Image upload failed.');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Chapter.create({
      name,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      description: description || undefined,
      cover_image_url: coverUrl || undefined,
      privacy,
    });
    queryClient.invalidateQueries({ queryKey: ['chapters'] });
    setToast('Chapter created.');
    setTimeout(() => router.push(createPageUrl('Chapters')), 1200);
  };

  if (atLimit) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-lg font-semibold text-[#111111] ml-3">New Chapter</h1>
        </div>
        <div className="px-6 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] mb-2">Chapter limit reached</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Free accounts can have up to {FREE_CHAPTER_LIMIT} chapters.<br />Upgrade to create unlimited chapters.
          </p>
          <Button onClick={() => router.push(createPageUrl('Paywall'))} className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 px-8">
            Upgrade Plan
          </Button>
          <button onClick={() => router.back()} className="mt-3 text-sm text-gray-400">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">New Chapter</h1>
      </div>

      <div className="px-6 mb-5">
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Start from a template</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CHAPTER_TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => { setName(t.name); setDescription(t.description); }}
              className="flex-shrink-0 px-3.5 py-2 bg-[#F5F5F5] rounded-xl text-xs font-medium text-gray-600 hover:bg-[#1A1A2E] hover:text-white transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-5">
        <div className="block cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-full h-36 rounded-xl bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <span className="text-xs text-gray-300">{uploading ? 'Uploading...' : 'Add cover image'}</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Chapter Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name this chapter"
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Date From</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Date To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between mb-1.5">
            <Label className="text-xs font-medium text-gray-500">Description</Label>
            <VoiceInput onTranscript={(text) => setDescription(prev => prev ? prev + ' ' + text : text)} />
          </div>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this chapter about?"
            className="bg-[#F5F5F5] border-0 rounded-xl text-[#111111] placeholder:text-gray-300 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Privacy</Label>
          <div className="flex bg-[#F5F5F5] rounded-full p-1">
            {['private', 'circles'].map(p => (
              <button key={p} onClick={() => setPrivacy(p)}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${privacy === p ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'}`}>
                {p === 'private' ? 'Private' : 'Share to circles'}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium mt-4 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save chapter'}
        </Button>
      </div>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
