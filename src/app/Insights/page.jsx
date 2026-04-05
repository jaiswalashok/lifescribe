'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Sparkles, Brain, TrendingUp, Heart, Calendar, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Insights() {
  const router = useRouter();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: entries = [] } = useQuery({
    queryKey: ['journal_entries'],
    queryFn: () => base44.entities.JournalEntry.filter({ is_deleted: false }),
  });

  const handleGenerate = async () => {
    if (entries.length < 3) {
      setError('Write at least 3 journal entries to generate insights.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/life-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      } else {
        setError('Could not generate insights right now. Try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const moodCounts = entries.reduce((acc, e) => {
    if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const totalWords = entries.reduce((sum, e) => sum + (e.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Life Insights</h1>
        {insights && (
          <button onClick={handleGenerate} disabled={loading} className="ml-auto text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-6 pb-28">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Entries', value: entries.length },
            { label: 'Words written', value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords },
            { label: 'Top mood', value: topMood ? topMood[0] : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F5F5F5] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#1A1A2E]">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {!insights && !loading && (
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Discover your patterns</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-8">
              Lifescribe will analyse your journal entries and surface themes, emotional patterns, and personalised encouragement.
            </p>
            {entries.length < 3 && (
              <p className="text-xs text-amber-500 bg-amber-50 rounded-full px-4 py-2 mb-6">
                Write at least 3 entries to unlock insights
              </p>
            )}
            <Button
              onClick={handleGenerate}
              disabled={entries.length < 3}
              className="bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-12 px-8 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" /> Generate insights
            </Button>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Analysing your journal…</p>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#2a2a4e] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-300" />
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Your story so far</p>
              </div>
              <p className="text-sm leading-relaxed text-white/90">{insights.summary}</p>
            </div>

            {/* Themes */}
            {insights.top_themes?.length > 0 && (
              <div className="bg-[#F5F5F5] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recurring themes</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.top_themes.map(t => (
                    <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 font-medium capitalize">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Mood pattern */}
            {insights.mood_pattern && (
              <div className="bg-[#F5F5F5] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emotional patterns</p>
                </div>
                <p className="text-sm text-[#111111] leading-relaxed">{insights.mood_pattern}</p>
              </div>
            )}

            {/* Writing habit */}
            {insights.most_active_period && (
              <div className="bg-[#F5F5F5] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Writing habit</p>
                </div>
                <p className="text-sm text-[#111111] leading-relaxed">{insights.most_active_period}</p>
              </div>
            )}

            {/* Growth areas */}
            {insights.growth_areas?.length > 0 && (
              <div className="bg-[#F5F5F5] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Areas of growth</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.growth_areas.map(a => (
                    <span key={a} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1 font-medium capitalize">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragement */}
            {insights.encouragement && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">For you</p>
                </div>
                <p className="text-sm text-[#1A1A2E] leading-relaxed font-medium">{insights.encouragement}</p>
              </div>
            )}

            <p className="text-center text-[10px] text-gray-300 pt-2">AI suggestion · please verify · based on your entries</p>
          </div>
        )}
      </div>
    </div>
  );
}
