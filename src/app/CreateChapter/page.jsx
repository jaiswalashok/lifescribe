'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Toast from '@/components/lifescribe/Toast';
import { ChevronLeft, Camera } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VoiceInput from '@/components/lifescribe/VoiceInput';

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

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">New Chapter</h1>
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
