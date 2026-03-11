'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Toast from '@/components/lifescribe/Toast';
import BottomSheet from '@/components/lifescribe/BottomSheet';
import PillBadge from '@/components/lifescribe/PillBadge';
import { MOOD_OPTIONS, SLEEP_OPTIONS, MOTIVATION_OPTIONS, getMoodLabel, getSleepLabel, getMotivationLabel } from '@/components/lifescribe/constants';
import { ChevronLeft, Image, Film, Mic, MapPin, AtSign, Smile, Calendar } from 'lucide-react';
import VoiceInput from '@/components/lifescribe/VoiceInput';

function CreateEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const promptText = searchParams.get('prompt') || '';

  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [motivation, setMotivation] = useState('');
  const [audience, setAudience] = useState('private');
  const [chapterId, setChapterId] = useState(searchParams.get('chapter') || '');
  const [location, setLocation] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [showMood, setShowMood] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list(),
  });

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.JournalEntry.create({
      content,
      mood: mood || undefined,
      sleep_quality: sleepQuality || undefined,
      motivation: motivation || undefined,
      audience,
      chapter_id: chapterId || undefined,
      location: location || undefined,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      media_types: mediaTypes.length > 0 ? mediaTypes : undefined,
      entry_date: entryDate,
    });
    if (mood) {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, { current_mood: mood });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
    setToast('Entry saved.');
    setTimeout(() => router.push(createPageUrl('Home')), 1200);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => router.back()} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Button onClick={handleSave} disabled={!content.trim() || saving}
          className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-9 px-5 text-sm font-medium disabled:opacity-40">
          {saving ? 'Saving...' : 'Post'}
        </Button>
      </div>

      <button onClick={() => setShowDate(!showDate)} className="px-6 mb-2">
        <span className="text-sm text-gray-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(entryDate), 'EEEE, MMMM d, yyyy')}
        </span>
      </button>
      {showDate && (
        <div className="px-6 mb-3">
          <input type="date" value={entryDate}
            onChange={e => { setEntryDate(e.target.value); setShowDate(false); }}
            className="text-sm bg-[#F5F5F5] rounded-lg px-3 py-2 border-0" />
        </div>
      )}

      <div className="px-6 flex flex-wrap gap-1.5 mb-3">
        {mood && <PillBadge text={getMoodLabel(mood)} />}
        {sleepQuality && <PillBadge text={getSleepLabel(sleepQuality)} />}
        {motivation && <PillBadge text={getMotivationLabel(motivation)} />}
      </div>

      <div className="flex-1 px-6">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder={promptText || "What's on your mind?"}
          className="w-full h-full min-h-[300px] text-base text-[#111111] placeholder:text-gray-300 resize-none border-0 outline-none leading-relaxed bg-transparent" />
      </div>

      {mediaUrls.length > 0 && (
        <div className="px-6 py-2 flex gap-2 overflow-x-auto">
          {mediaUrls.map((url, i) => (
            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-3 flex gap-3">
        <select value={chapterId} onChange={e => setChapterId(e.target.value)}
          className="text-xs bg-[#F5F5F5] rounded-full px-3 py-1.5 border-0 text-gray-500">
          <option value="">No chapter</option>
          {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
        </select>
        <div className="flex bg-[#F5F5F5] rounded-full p-0.5">
          {['private', 'connections'].map(a => (
            <button key={a} onClick={() => setAudience(a)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${audience === a ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'}`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-5">
        <label className="cursor-pointer text-gray-400 hover:text-gray-600">
          <Image className="w-5 h-5" />
          <input type="file" accept="image/*" multiple className="hidden" />
        </label>
        <button className="text-gray-400 hover:text-gray-600"><Film className="w-5 h-5" /></button>
        <button className="text-gray-400 hover:text-gray-600"><MapPin className="w-5 h-5" /></button>
        <button className="text-gray-400 hover:text-gray-600"><AtSign className="w-5 h-5" /></button>
        <button onClick={() => setShowMood(true)} className="text-gray-400 hover:text-gray-600">
          <Smile className="w-5 h-5" />
        </button>
        <VoiceInput
          onTranscript={(text) => setContent(prev => prev ? prev + ' ' + text : text)}
          className="ml-auto"
        />
      </div>

      <BottomSheet open={showMood} onClose={() => setShowMood(false)} title="What mood are you in today?">
        <div className="grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { setMood(opt.value); setShowMood(false); setShowSleep(true); }}
              className={`p-3 rounded-xl text-center transition-all ${mood === opt.value ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111] hover:bg-gray-100'}`}>
              <div className="text-xl mb-1">{opt.emoji}</div>
              <div className="text-xs font-medium">{opt.label}</div>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showSleep} onClose={() => setShowSleep(false)} title="How did you sleep?">
        <div className="space-y-2">
          {SLEEP_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { setSleepQuality(opt.value); setShowSleep(false); setShowMotivation(true); }}
              className={`w-full p-3.5 rounded-xl text-left flex items-center gap-3 transition-all ${sleepQuality === opt.value ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showMotivation} onClose={() => setShowMotivation(false)} title="How motivated are you?">
        <div className="space-y-2">
          {MOTIVATION_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { setMotivation(opt.value); setShowMotivation(false); }}
              className={`w-full p-3.5 rounded-xl text-left flex items-center gap-3 transition-all ${motivation === opt.value ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function CreateEntry() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <CreateEntryContent />
    </Suspense>
  );
}
