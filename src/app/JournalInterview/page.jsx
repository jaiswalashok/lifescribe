'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Sparkles, Send, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JournalInterview() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedEntry, setGeneratedEntry] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | interview | generated
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  const callInterview = async (action, currentHistory = history) => {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: currentHistory, action }),
    });
    const data = await res.json();
    return data.text || '';
  };

  const handleStart = async () => {
    setLoading(true);
    setPhase('interview');
    try {
      const question = await callInterview('open', []);
      setHistory([{ role: 'assistant', text: question }]);
    } catch {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input.trim() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setInput('');

    const userTurns = newHistory.filter(m => m.role === 'user').length;
    if (userTurns >= 4) return; // cap at 4 user answers

    setLoading(true);
    try {
      const question = await callInterview('followup', newHistory);
      if (question) setHistory(h => [...h, { role: 'assistant', text: question }]);
    } catch {}
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const entry = await callInterview('generate', history);
      setGeneratedEntry(entry);
      setPhase('generated');
    } catch {}
    setGenerating(false);
  };

  const handleUseEntry = () => {
    router.push(
      createPageUrl('CreateEntry') + '?prompt=' + encodeURIComponent(generatedEntry)
    );
  };

  const userTurns = history.filter(m => m.role === 'user').length;
  const canGenerate = userTurns >= 1;
  const maxTurns = userTurns >= 4;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center px-4 pt-12 pb-4 border-b border-gray-50">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <div className="ml-3">
          <h1 className="text-base font-semibold text-[#111111]">Journal Interview</h1>
          <p className="text-xs text-gray-400">AI helps you reflect</p>
        </div>
        {phase === 'interview' && canGenerate && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="ml-auto flex items-center gap-1.5 text-xs text-purple-600 font-medium bg-purple-50 rounded-full px-3 py-1.5 disabled:opacity-40"
          >
            {generating
              ? <div className="w-3 h-3 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
              : <FileText className="w-3.5 h-3.5" />}
            Generate entry
          </button>
        )}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Let's journal together</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-8">
              Answer a few short questions and Lifescribe will shape your responses into a beautiful journal entry.
            </p>
            <Button
              onClick={handleStart}
              disabled={loading}
              className="bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-12 px-8 text-sm font-semibold flex items-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Start interview</>}
            </Button>
          </div>
        )}

        {phase === 'generated' && (
          <div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Your entry</p>
              </div>
              <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">{generatedEntry}</p>
            </div>
            <p className="text-center text-[10px] text-gray-300 mb-6">AI suggestion · please verify · edit before saving</p>
            <div className="flex gap-3">
              <Button
                onClick={handleUseEntry}
                className="flex-1 bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-semibold"
              >
                Use this entry
              </Button>
              <button
                onClick={() => { setPhase('interview'); setGeneratedEntry(''); }}
                className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 'interview' && history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#1A1A2E] text-white rounded-br-sm'
                : 'bg-[#F5F5F5] text-[#111111] rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {phase === 'interview' && loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {phase === 'interview' && maxTurns && !loading && (
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400 mb-3">You've shared a lot — ready to create your entry?</p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-10 px-6 text-sm font-semibold flex items-center gap-2 mx-auto disabled:opacity-40"
            >
              {generating
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><FileText className="w-4 h-4" /> Generate my entry</>}
            </Button>
          </div>
        )}
      </div>

      {/* Input bar */}
      {phase === 'interview' && !maxTurns && !loading && (
        <div className="px-4 py-4 border-t border-gray-100 flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Your answer…"
            rows={1}
            className="flex-1 bg-[#F5F5F5] rounded-2xl px-4 py-3 text-sm text-[#111111] placeholder:text-gray-300 border-0 outline-none resize-none max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 disabled:opacity-30"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
