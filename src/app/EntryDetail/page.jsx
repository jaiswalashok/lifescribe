'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import PillBadge from '@/components/lifescribe/PillBadge';
import Toast from '@/components/lifescribe/Toast';
import { getMoodLabel, getSleepLabel, getMotivationLabel } from '@/components/lifescribe/constants';
import { ChevronLeft, Trash2, Pencil, Lock, Users, Globe } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function EntryDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const entryId = searchParams.get('id');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const { data: entry } = useQuery({
    queryKey: ['entry', entryId],
    queryFn: async () => {
      const entries = await base44.entities.JournalEntry.list();
      return entries.find(e => e.id === entryId);
    },
    enabled: !!entryId,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list(),
  });

  if (!entry) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  const chapter = chapters.find(c => c.id === entry.chapter_id);
  const entryDate = entry.entry_date || entry.created_date;
  const wordCount = entry.content?.split(/\s+/).filter(Boolean).length || 0;
  const charCount = entry.content?.length || 0;
  const AudienceIcon = entry.audience === 'private' ? Lock : entry.audience === 'connections' ? Users : Globe;

  const handleDelete = async () => {
    await base44.entities.JournalEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
    setToast('Entry deleted.');
    setTimeout(() => router.push(createPageUrl('Home')), 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 pt-12 pb-3 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-6 pb-12">
        <p className="text-sm text-gray-400 mb-2">{entryDate ? format(new Date(entryDate), 'EEEE, MMMM d, yyyy') : ''}</p>
        {chapter && <span className="inline-block text-xs bg-[#1A1A2E] text-white px-2.5 py-0.5 rounded-full font-medium mb-3">{chapter.name}</span>}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {entry.mood && <PillBadge text={getMoodLabel(entry.mood)} />}
          {entry.sleep_quality && <PillBadge text={getSleepLabel(entry.sleep_quality)} />}
          {entry.motivation && <PillBadge text={getMotivationLabel(entry.motivation)} />}
        </div>
        <p className="text-base text-[#111111] leading-relaxed whitespace-pre-wrap mb-6">{entry.content}</p>
        {entry.media_urls?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {entry.media_urls.map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-gray-50 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <AudienceIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{entry.audience || 'Private'}</span>
          </div>
          <p className="text-xs text-gray-300">{wordCount} words · {charCount} characters</p>
          {entry.location && <p className="text-xs text-gray-300">📍 {entry.location}</p>}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This entry will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function EntryDetail() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <EntryDetailContent />
    </Suspense>
  );
}
