'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import BottomTabBar from '@/components/lifescribe/BottomTabBar';
import EmptyState from '@/components/lifescribe/EmptyState';
import CreatePostModal from '@/components/lifescribe/CreatePostModal';
import { format } from 'date-fns';
import { Layers, Image as ImageIcon } from 'lucide-react';

export default function Chapters() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => base44.entities.Chapter.list('-created_date'),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['journal_entries'],
    queryFn: () => base44.entities.JournalEntry.list(),
  });

  const getEntryCount = (chapterId) => entries.filter(e => e.chapter_id === chapterId).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="bg-white px-6 pt-14 pb-5">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Chapters</h1>
      </div>

      <div className="px-4 pt-4">
        {chapters.length === 0 ? (
          <EmptyState
            icon={Layers}
            message="No chapters yet. Create one to start organising your story."
            ctaText="Create a chapter"
            onAction={() => router.push(createPageUrl('CreateChapter'))}
          />
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {chapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => router.push(createPageUrl('ChapterDetail') + `?id=${ch.id}`)}
                  className="w-full bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-left flex gap-4"
                >
                  <div className="w-16 h-16 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ch.cover_image_url ? (
                      <img src={ch.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#111111] mb-1 truncate">{ch.name}</h3>
                    <p className="text-xs text-gray-400 mb-1">
                      {ch.date_from ? format(new Date(ch.date_from), 'MMM yyyy') : ''}
                      {ch.date_to ? ` — ${format(new Date(ch.date_to), 'MMM yyyy')}` : ''}
                    </p>
                    <p className="text-xs text-gray-300">{getEntryCount(ch.id)} entries</p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => router.push(createPageUrl('CreateChapter'))}
              className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium"
            >
              Create chapter
            </Button>
          </>
        )}
      </div>

      <BottomTabBar currentPage="Chapters" onCreatePress={() => setShowCreateModal(true)} />
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
