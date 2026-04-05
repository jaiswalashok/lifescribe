'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Download, FileText, Archive, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function Export() {
  const router = useRouter();
  const [exporting, setExporting] = useState(null); // null | 'text' | 'json'
  const [done, setDone] = useState(null);

  const { data: entries = [] } = useQuery({ queryKey: ['journal_entries'], queryFn: () => base44.entities.JournalEntry.list('-created_date', 500) });
  const { data: chapters = [] } = useQuery({ queryKey: ['chapters'], queryFn: () => base44.entities.Chapter.list() });
  const { data: capsules = [] } = useQuery({ queryKey: ['moment_capsules'], queryFn: () => base44.entities.MomentCapsule.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });

  const profile = profiles[0] || {};
  const activeEntries = entries.filter(e => !e.is_deleted);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsText = async () => {
    setExporting('text');
    const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c.name]));
    const lines = [];

    lines.push('LIFESCRIBE VAULT EXPORT');
    lines.push(`Exported: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`);
    lines.push(`User: ${profile.full_name || profile.username || 'Unknown'}`);
    lines.push(`Total entries: ${activeEntries.length}`);
    lines.push('='.repeat(60));
    lines.push('');

    for (const entry of activeEntries) {
      const date = entry.entry_date || entry.created_date;
      lines.push(`DATE: ${date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : 'Unknown date'}`);
      if (entry.chapter_id && chapterMap[entry.chapter_id]) {
        lines.push(`CHAPTER: ${chapterMap[entry.chapter_id]}`);
      }
      if (entry.mood) lines.push(`MOOD: ${entry.mood}`);
      if (entry.sleep_quality) lines.push(`SLEEP: ${entry.sleep_quality}`);
      if (entry.motivation) lines.push(`MOTIVATION: ${entry.motivation}`);
      if (entry.location) lines.push(`LOCATION: ${entry.location}`);
      if (entry.tags?.length) lines.push(`TAGS: #${entry.tags.join(' #')}`);
      lines.push(`PRIVACY: ${entry.audience || 'private'}`);
      if (entry.deliver_after_death) lines.push(`DELIVER AFTER DEATH: yes`);
      lines.push('');
      lines.push(entry.content || '');
      if (entry.media_urls?.length) {
        lines.push('');
        lines.push(`MEDIA: ${entry.media_urls.length} attachment(s)`);
        entry.media_urls.forEach((url, i) => lines.push(`  [${i + 1}] ${url}`));
      }
      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('');
    }

    if (chapters.length > 0) {
      lines.push('CHAPTERS');
      lines.push('='.repeat(60));
      for (const ch of chapters) {
        lines.push(`• ${ch.name}${ch.date_from ? ` (${ch.date_from} – ${ch.date_to || 'present'})` : ''}`);
        if (ch.description) lines.push(`  ${ch.description}`);
      }
      lines.push('');
    }

    if (capsules.length > 0) {
      lines.push('MOMENT CAPSULES');
      lines.push('='.repeat(60));
      for (const cap of capsules) {
        lines.push(`• ${cap.title}${cap.event_date ? ` (${format(new Date(cap.event_date), 'MMM d, yyyy')})` : ''}`);
        if (cap.description) lines.push(`  ${cap.description}`);
      }
      lines.push('');
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd');
    downloadFile(lines.join('\n'), `lifescribe-export-${timestamp}.txt`, 'text/plain');
    setExporting(null);
    setDone('text');
    setTimeout(() => setDone(null), 3000);
  };

  const exportAsJson = async () => {
    setExporting('json');
    const payload = {
      exported_at: new Date().toISOString(),
      user: {
        full_name: profile.full_name,
        username: profile.username,
        plan_type: profile.plan_type,
      },
      entries: activeEntries.map(e => ({
        id: e.id,
        content: e.content,
        entry_date: e.entry_date || e.created_date,
        mood: e.mood,
        sleep_quality: e.sleep_quality,
        motivation: e.motivation,
        audience: e.audience,
        chapter_id: e.chapter_id,
        tags: e.tags,
        location: e.location,
        media_urls: e.media_urls,
        media_types: e.media_types,
      })),
      chapters: chapters.map(c => ({
        id: c.id,
        name: c.name,
        date_from: c.date_from,
        date_to: c.date_to,
        description: c.description,
        privacy: c.privacy,
      })),
      capsules: capsules.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        event_date: c.event_date,
      })),
    };

    const timestamp = format(new Date(), 'yyyy-MM-dd');
    downloadFile(JSON.stringify(payload, null, 2), `lifescribe-export-${timestamp}.json`, 'application/json');
    setExporting(null);
    setDone('json');
    setTimeout(() => setDone(null), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Export My Vault</h1>
      </div>

      <div className="px-6">
        <div className="bg-[#F5F5F5] rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-[#111111]">{activeEntries.length}</p>
              <p className="text-xs text-gray-400">Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111111]">{chapters.length}</p>
              <p className="text-xs text-gray-400">Chapters</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111111]">{capsules.length}</p>
              <p className="text-xs text-gray-400">Capsules</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={exportAsText}
            disabled={!!exporting}
            className="w-full bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-2xl p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              {exporting === 'text' ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> :
               done === 'text' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
               <FileText className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111111]">Export as Text</p>
              <p className="text-xs text-gray-400 mt-0.5">Plain-text file with all entries, readable anywhere</p>
              {done === 'text' && <p className="text-xs text-green-600 mt-1">Downloaded!</p>}
            </div>
            {!exporting && <Download className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </button>

          <button
            onClick={exportAsJson}
            disabled={!!exporting}
            className="w-full bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-2xl p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              {exporting === 'json' ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> :
               done === 'json' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
               <Archive className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111111]">Export as JSON</p>
              <p className="text-xs text-gray-400 mt-0.5">Structured archive with all data, entries, chapters, and capsules</p>
              {done === 'json' && <p className="text-xs text-green-600 mt-1">Downloaded!</p>}
            </div>
            {!exporting && <Download className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </button>
        </div>

        <p className="text-xs text-gray-300 text-center mt-8 leading-relaxed">
          Your export includes all entries, chapters, and capsules.<br />
          Media file URLs are included but files are not downloaded.
        </p>
      </div>
    </div>
  );
}
