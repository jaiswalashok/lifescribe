'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, Plus, Share2, Check } from 'lucide-react';
import BottomSheet from '@/components/lifescribe/BottomSheet';
import Toast from '@/components/lifescribe/Toast';
import { Button } from '@/components/ui/button';
import JournalEntryCard from '@/components/lifescribe/JournalEntryCard';
import EmptyState from '@/components/lifescribe/EmptyState';
import { getEffectivePrivacy } from '@/components/lifescribe/privacyUtils';

function ChapterDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = searchParams.get('id');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [sharedCircleIds, setSharedCircleIds] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState('');

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list(),
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ['journal_entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date'),
  });

  const { data: circles = [] } = useQuery({
    queryKey: ['circles'],
    queryFn: () => base44.entities.Circle.list(),
  });

  const chapter = chapters.find(c => c.id === chapterId);
  const entries = allEntries.filter(e => {
    if (e.chapter_id !== chapterId || e.is_deleted) return false;
    const entryAudience = e.audience || 'private';
    const effectivePrivacy = getEffectivePrivacy(entryAudience, chapter?.privacy || 'private');
    e._effectiveAudience = effectivePrivacy;
    return true;
  });

  const handleShareToCircle = async () => {
    if (!sharedCircleIds.length) return;
    setSharing(true);
    await base44.entities.Chapter.update(chapterId, { shared_circle_ids: sharedCircleIds });
    setSharing(false);
    setShowShareSheet(false);
    setToast('Chapter shared to selected circles.');
  };

  if (!chapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-gray-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">{chapter.name}</h1>
            <p className="text-xs text-gray-400">
              {chapter.date_from ? format(new Date(chapter.date_from), 'MMM yyyy') : ''}
              {chapter.date_to ? ` — ${format(new Date(chapter.date_to), 'MMM yyyy')}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(createPageUrl('CreateEntry') + `?chapter=${chapterId}`)}
            variant="outline" size="sm"
            className="rounded-full text-xs border-gray-200 text-gray-500"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add entry
          </Button>
          <Button
            onClick={() => setShowShareSheet(true)}
            variant="outline" size="sm"
            className="rounded-full text-xs border-gray-200 text-gray-500"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Share to circle
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-12">
        {entries.length === 0 ? (
          <EmptyState
            message="No entries in this chapter yet."
            ctaText="Write an entry"
            onAction={() => router.push(createPageUrl('CreateEntry') + `?chapter=${chapterId}`)}
          />
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                chapters={chapters}
                onClick={() => router.push(createPageUrl('EntryDetail') + `?id=${entry.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={showShareSheet} onClose={() => setShowShareSheet(false)} title="Share chapter to circles">
        <div className="space-y-2 mb-4">
          {circles.length === 0 && <p className="text-sm text-gray-400">No circles found. Create one first.</p>}
          {circles.map(circle => {
            const selected = sharedCircleIds.includes(circle.id);
            return (
              <button key={circle.id} onClick={() => setSharedCircleIds(prev => selected ? prev.filter(id => id !== circle.id) : [...prev, circle.id])}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  selected ? 'border-[#1A1A2E] bg-[#1A1A2E]/5' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <span className="flex-1 text-sm text-left text-[#111111]">{circle.name}</span>
                {selected && <Check className="w-4 h-4 text-[#1A1A2E]" />}
              </button>
            );
          })}
        </div>
        <Button onClick={handleShareToCircle} disabled={!sharedCircleIds.length || sharing}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium">
          {sharing ? 'Sharing…' : `Share to ${sharedCircleIds.length} circle${sharedCircleIds.length !== 1 ? 's' : ''}`}
        </Button>
      </BottomSheet>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function ChapterDetail() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <ChapterDetailContent />
    </Suspense>
  );
}
