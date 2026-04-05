'use client';
import React, { useState, useEffect, Suspense } from 'react';
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
import { ChevronLeft, Image, Film, Mic, MapPin, AtSign, Smile, Calendar, X, Tag, Lock, Sparkles } from 'lucide-react';
import VoiceInput from '@/components/lifescribe/VoiceInput';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function CreateEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const promptText = searchParams.get('prompt') || '';
  const editId = searchParams.get('edit') || null;
  const isEditMode = !!editId;

  // If prompt is a long generated entry (from JournalInterview), pre-fill content
  const [content, setContent] = useState(promptText.length > 80 ? promptText : '');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [motivation, setMotivation] = useState('');
  const [audience, setAudience] = useState('private');
  const [chapterId, setChapterId] = useState(searchParams.get('chapter') || '');
  const [location, setLocation] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [deliverAfterDeath, setDeliverAfterDeath] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [aiSuggestedTags, setAiSuggestedTags] = useState([]);
  const [captioningIdx, setCaptioningIdx] = useState(null);
  const [locating, setLocating] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(!!searchParams.get('edit'));

  useEffect(() => {
    const id = searchParams.get('edit');
    if (!id) return;
    (async () => {
      try {
        const entries = await base44.entities.JournalEntry.list();
        const entry = entries.find(e => e.id === id);
        if (entry) {
          setContent(entry.content || '');
          setEntryDate(entry.entry_date || new Date().toISOString().split('T')[0]);
          setMood(entry.mood || '');
          setSleepQuality(entry.sleep_quality || '');
          setMotivation(entry.motivation || '');
          setAudience(entry.audience || 'private');
          setChapterId(entry.chapter_id || '');
          setLocation(entry.location || '');
          setMediaUrls(entry.media_urls || []);
          setMediaTypes(entry.media_types || []);
          setTags(entry.tags || []);
          setDeliverAfterDeath(entry.deliver_after_death || false);
        }
      } catch (err) {
        console.error('Failed to load entry for editing:', err);
      }
      setLoadingEntry(false);
    })();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const place = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const country = addr.country_code?.toUpperCase() || '';
          setLocation(place ? (country ? `${place}, ${country}` : place) : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch {
          setLocation('Location added');
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleCaptionImage = async (url, idx) => {
    setCaptioningIdx(idx);
    try {
      const res = await fetch('/api/caption-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (data.caption) {
        setContent(prev => prev ? prev + '\n\n' + data.caption : data.caption);
      }
    } catch {}
    setCaptioningIdx(null);
  };

  const handleSuggestTags = async () => {
    if (!content.trim() || content.trim().length < 20) return;
    setSuggestingTags(true);
    try {
      const res = await fetch('/api/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      const newSuggestions = (data.tags || []).filter(t => !tags.includes(t));
      setAiSuggestedTags(newSuggestions);
      if (newSuggestions.length > 0) setShowTagInput(true);
    } catch {}
    setSuggestingTags(false);
  };

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list(),
  });

  const handleMediaUpload = async (files, type) => {
    console.log('handleMediaUpload called', { files, type, count: files?.length });
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        console.log('Uploading file:', file.name, file.type, file.size);
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `entry_media/${fileName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log('Upload successful:', url);
        return { url, type };
      });
      const results = await Promise.all(uploadPromises);
      setMediaUrls(prev => [...prev, ...results.map(r => r.url)]);
      setMediaTypes(prev => [...prev, ...results.map(r => r.type)]);
      setToast(`${results.length} file(s) uploaded successfully`);
    } catch (err) {
      console.error('Upload error:', err);
      setToast('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const removeMedia = (index) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
    setMediaTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    // Auto-tag if user hasn't added any tags and content is substantial (#61)
    let finalTags = tags;
    if (tags.length === 0 && content.trim().length >= 50) {
      try {
        const res = await fetch('/api/suggest-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content }),
        });
        const data = await res.json();
        if (data.tags?.length) finalTags = data.tags;
      } catch {}
    }

    const payload = {
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
      tags: finalTags.length > 0 ? finalTags : undefined,
      deliver_after_death: deliverAfterDeath,
      is_deleted: false,
    };
    try {
      if (isEditMode) {
        await base44.entities.JournalEntry.update(editId, payload);
      } else {
        await base44.entities.JournalEntry.create(payload);
      }
      if (mood) {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles.length > 0) {
          await base44.entities.UserProfile.update(profiles[0].id, { current_mood: mood });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      setToast(isEditMode ? 'Entry updated.' : 'Entry saved.');
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('Entry save error:', err);
      setToast(err.message?.includes('permission')
        ? 'Unable to save entry. Please try signing out and back in.'
        : err.message || 'Failed to save entry. Please try again.');
    }
    setSaving(false);
  };

  if (loadingEntry) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => router.back()} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        {isEditMode && <span className="text-sm font-medium text-gray-500">Edit Entry</span>}
        <Button onClick={handleSave} disabled={!content.trim() || saving}
          className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-9 px-5 text-sm font-medium disabled:opacity-40">
          {saving ? (isEditMode ? 'Saving...' : 'Saving...') : (isEditMode ? 'Save' : 'Post')}
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
        {location && (
          <button onClick={() => setLocation('')}
            className="flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1">
            <MapPin className="w-3 h-3" />{location}<X className="w-3 h-3 ml-0.5" />
          </button>
        )}
        {tags.map(t => (
          <button key={t} onClick={() => setTags(prev => prev.filter(x => x !== t))}
            className="flex items-center gap-1 text-xs bg-[#1A1A2E] text-white rounded-full px-2.5 py-1">
            #{t}<X className="w-3 h-3 ml-0.5" />
          </button>
        ))}
      </div>

      {showTagInput && (
        <div className="px-6 mb-2 space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={tagInput}
              onChange={e => setTagInput(e.target.value.replace(/\s/g, ''))}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().toLowerCase();
                  if (!tags.includes(t)) setTags(prev => [...prev, t]);
                  setTagInput('');
                }
                if (e.key === 'Escape') setShowTagInput(false);
              }}
              placeholder="Add tag, press Enter"
              className="flex-1 text-sm bg-[#F5F5F5] rounded-lg px-3 py-1.5 border-0 outline-none"
            />
            <button
              onClick={handleSuggestTags}
              disabled={suggestingTags || content.trim().length < 20}
              className="flex items-center gap-1 text-xs text-purple-600 font-medium disabled:opacity-30"
            >
              {suggestingTags
                ? <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              Suggest
            </button>
            <button onClick={() => setShowTagInput(false)} className="text-gray-400 text-xs">Done</button>
          </div>
          {aiSuggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {aiSuggestedTags.map(t => (
                <button
                  key={t}
                  onClick={() => {
                    if (!tags.includes(t)) setTags(prev => [...prev, t]);
                    setAiSuggestedTags(prev => prev.filter(s => s !== t));
                  }}
                  className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1 flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" /> #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 px-6">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder={promptText || "What's on your mind?"}
          className="w-full h-full min-h-[300px] text-base text-[#111111] placeholder:text-gray-300 resize-none border-0 outline-none leading-relaxed bg-transparent" />
      </div>

      {mediaUrls.length > 0 && (
        <div className="px-6 py-2 flex gap-2 overflow-x-auto">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                {mediaTypes[i] === 'video' ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center z-10">
                <X className="w-3 h-3 text-white" />
              </button>
              {mediaTypes[i] === 'image' && (
                <button
                  onClick={() => handleCaptionImage(url, i)}
                  disabled={captioningIdx === i}
                  className="mt-1 w-20 flex items-center justify-center gap-1 text-[9px] text-purple-600 font-medium disabled:opacity-40"
                >
                  {captioningIdx === i
                    ? <div className="w-2.5 h-2.5 border border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    : <Sparkles className="w-2.5 h-2.5" />}
                  Caption
                </button>
              )}
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
        <label className="cursor-pointer text-gray-400 hover:text-gray-600" title="Add photos">
          <Image className="w-5 h-5" />
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e.target.files, 'image')} disabled={uploading} />
        </label>
        <label className="cursor-pointer text-gray-400 hover:text-gray-600" title="Add video">
          <Film className="w-5 h-5" />
          <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e.target.files, 'video')} disabled={uploading} />
        </label>
        <button
          onClick={handleGetLocation}
          disabled={locating}
          title={location || 'Add location'}
          className={`transition-colors disabled:opacity-40 ${location ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {locating ? <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" /> : <MapPin className="w-5 h-5" />}
        </button>
        <button onClick={() => setShowTagInput(p => !p)} className="text-gray-400 hover:text-gray-600"><Tag className="w-5 h-5" /></button>
        <button
          onClick={() => setDeliverAfterDeath(p => !p)}
          title={deliverAfterDeath ? 'Will be delivered after death' : 'Deliver after death'}
          className={`transition-colors ${deliverAfterDeath ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Lock className="w-5 h-5" />
        </button>
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
