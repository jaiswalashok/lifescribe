'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

async function polishWithGemini(rawText) {
  if (!rawText.trim()) return rawText;

  try {
    const res = await fetch('/api/polish-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    });
    const data = await res.json();
    return data?.polished || rawText;
  } catch {
    return rawText;
  }
}

export default function VoiceInput({ onTranscript, className = '' }) {
  const [state, setState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [error, setError] = useState('');
  const [showAiLabel, setShowAiLabel] = useState(false);
  const recognitionRef = useRef(null);
  const accumulatedRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    setError('');
    accumulatedRef.current = '';

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setState('recording');

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ');
      accumulatedRef.current = transcript;
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') setError('Microphone error: ' + e.error);
      setState('idle');
    };

    recognition.onend = async () => {
      const raw = accumulatedRef.current.trim();
      if (!raw) {
        setState('idle');
        return;
      }
      setState('processing');
      const polished = await polishWithGemini(raw);
      onTranscript?.(polished);
      setState('idle');
      setShowAiLabel(true);
      setTimeout(() => setShowAiLabel(false), 4000);
    };

    recognition.start();
  }, [onTranscript]);

  const handleClick = () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const title =
    state === 'recording'
      ? 'Tap to stop recording'
      : state === 'processing'
      ? 'Polishing with AI…'
      : 'Tap to speak';

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'processing'}
        title={title}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
          ${
            state === 'recording'
              ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
              : state === 'processing'
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#F5F5F5] text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }`}
      >
        {state === 'processing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === 'recording' ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {state === 'recording' && (
        <span className="absolute -bottom-5 text-[10px] text-red-500 font-medium whitespace-nowrap">
          Listening…
        </span>
      )}

      {error && (
        <span className="absolute -bottom-5 text-[10px] text-red-500 whitespace-nowrap">
          {error}
        </span>
      )}
      {showAiLabel && (
        <span className="absolute -bottom-5 text-[10px] text-amber-500 font-medium whitespace-nowrap">
          AI suggestion · please verify
        </span>
      )}
    </div>
  );
}
