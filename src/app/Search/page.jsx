'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Layers, Archive, BookOpen, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'entries',  label: 'Entries',  icon: BookOpen },
  { id: 'chapters', label: 'Chapters', icon: Layers },
  { id: 'capsules', label: 'Capsules', icon: Archive },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: entries = [] } = useQuery({ queryKey: ['journal_entries'], queryFn: () => base44.entities.JournalEntry.list('-created_date', 200) });
  const { data: chapters = [] } = useQuery({ queryKey: ['chapters'], queryFn: () => base44.entities.Chapter.list() });
  const { data: capsules = [] } = useQuery({ queryKey: ['moment_capsules'], queryFn: () => base44.entities.MomentCapsule.list() });

  const lq = query.toLowerCase().trim();

  const results = useMemo(() => {
    const out = [];

    if ((typeFilter === 'all' || typeFilter === 'entries') && lq) {
      entries
        .filter(e => !e.is_deleted)
        .filter(e => {
          const matchText = e.content?.toLowerCase().includes(lq) || e.tags?.some(t => t.includes(lq));
          const matchChapter = !chapterFilter || e.chapter_id === chapterFilter;
          const matchFrom = !dateFrom || (e.entry_date || e.created_date) >= dateFrom;
          const matchTo = !dateTo || (e.entry_date || e.created_date) <= dateTo;
          return matchText && matchChapter && matchFrom && matchTo;
        })
        .forEach(e => out.push({ type: 'entry', item: e }));
    }

    if ((typeFilter === 'all' || typeFilter === 'chapters') && lq) {
      chapters
        .filter(c => c.name?.toLowerCase().includes(lq) || c.description?.toLowerCase().includes(lq))
        .forEach(c => out.push({ type: 'chapter', item: c }));
    }

    if ((typeFilter === 'all' || typeFilter === 'capsules') && lq) {
      capsules
        .filter(c => c.title?.toLowerCase().includes(lq) || c.description?.toLowerCase().includes(lq))
        .forEach(c => out.push({ type: 'capsule', item: c }));
    }

    return out;
  }, [lq, typeFilter, chapterFilter, dateFrom, dateTo, entries, chapters, capsules]);

  const handleResultClick = (r) => {
    if (r.type === 'entry') router.push(createPageUrl('EntryDetail') + `?id=${r.item.id}`);
    if (r.type === 'chapter') router.push(createPageUrl('ChapterDetail') + `?id=${r.item.id}`);
    if (r.type === 'capsule') router.push(createPageUrl('CapsuleDetail') + `?id=${r.item.id}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-gray-400">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search entries, chapters, capsules…"
              className="w-full bg-[#F5F5F5] rounded-xl h-10 pl-9 pr-4 text-sm text-[#111111] placeholder:text-gray-300 border-0 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(p => !p)} className={`text-gray-400 ${showFilters ? 'text-[#111111]' : ''}`}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${typeFilter === tab.id ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
            {(typeFilter === 'all' || typeFilter === 'entries') && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Chapter</label>
                <select value={chapterFilter} onChange={e => setChapterFilter(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg h-9 px-3 text-sm text-gray-600 border-0 outline-none">
                  <option value="">All chapters</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">From date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg h-9 px-3 text-sm text-gray-600 border-0 outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">To date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg h-9 px-3 text-sm text-gray-600 border-0 outline-none" />
              </div>
            </div>
            {(chapterFilter || dateFrom || dateTo) && (
              <button onClick={() => { setChapterFilter(''); setDateFrom(''); setDateTo(''); }}
                className="text-xs text-red-400 hover:text-red-600">Clear filters</button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        {!lq && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">Start typing to search</p>
            <p className="text-xs text-gray-300 mt-1">Across entries, chapters, and capsules</p>
          </div>
        )}

        {lq && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-gray-400">No results for "{query}"</p>
            <p className="text-xs text-gray-300 mt-1">Try different keywords or adjust filters</p>
          </div>
        )}

        {lq && results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            <div className="space-y-2">
              {results.map((r, i) => {
                const { type, item } = r;
                if (type === 'entry') {
                  const chapter = chapters.find(c => c.id === item.chapter_id);
                  const date = item.entry_date || item.created_date;
                  const preview = item.content?.slice(0, 120);
                  return (
                    <button key={i} onClick={() => handleResultClick(r)}
                      className="w-full bg-white rounded-2xl p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 font-medium">Entry</span>
                        {chapter && <span className="text-[10px] bg-[#1A1A2E] text-white rounded-full px-2 py-0.5">{chapter.name}</span>}
                        <span className="text-[10px] text-gray-300 ml-auto">{date ? format(new Date(date), 'MMM d, yyyy') : ''}</span>
                      </div>
                      <p className="text-sm text-[#111111] leading-relaxed line-clamp-2">{preview}{item.content?.length > 120 ? '…' : ''}</p>
                      {item.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.tags.map(t => <span key={t} className="text-[10px] text-gray-400">#{t}</span>)}
                        </div>
                      )}
                    </button>
                  );
                }
                if (type === 'chapter') {
                  return (
                    <button key={i} onClick={() => handleResultClick(r)}
                      className="w-full bg-white rounded-2xl p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-purple-100 text-purple-600 rounded-full px-2 py-0.5 font-medium">Chapter</span>
                      </div>
                      <p className="text-sm font-semibold text-[#111111]">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                    </button>
                  );
                }
                if (type === 'capsule') {
                  return (
                    <button key={i} onClick={() => handleResultClick(r)}
                      className="w-full bg-white rounded-2xl p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-medium">Capsule</span>
                        {item.event_date && <span className="text-[10px] text-gray-300 ml-auto">{format(new Date(item.event_date), 'MMM d, yyyy')}</span>}
                      </div>
                      <p className="text-sm font-semibold text-[#111111]">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
