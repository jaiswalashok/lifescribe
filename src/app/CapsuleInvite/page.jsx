'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { findCapsuleByToken } from '@/lib/entities';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { Archive, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '@/components/lifescribe/Toast';
import AddContributionSheet from '@/components/lifescribe/AddContributionSheet';

function CapsuleInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [user, setUser] = useState(undefined); // undefined = loading
  const [capsule, setCapsule] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showContribute, setShowContribute] = useState(false);
  const [contributed, setContributed] = useState(false);

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Store token in localStorage so it survives sign-up redirect
  useEffect(() => {
    if (token) localStorage.setItem('lifescribe_capsule_invite', token);
  }, [token]);

  // Fetch capsule once auth is known
  useEffect(() => {
    if (user === undefined) return; // still loading auth
    const t = token || localStorage.getItem('lifescribe_capsule_invite');
    if (!t) { setLoading(false); return; }

    (async () => {
      const found = await findCapsuleByToken(t);
      if (found) {
        setCapsule(found);
        if (user) {
          // fetch contributions
          const contribs = await base44.entities.CapsuleContribution.filter({ capsule_id: found.id });
          setContributions(contribs);
        }
      }
      setLoading(false);
    })();
  }, [user, token]);

  const handleSignUp = () => {
    const t = token || localStorage.getItem('lifescribe_capsule_invite');
    router.push(createPageUrl('CreateAccount') + `?next=CapsuleInvite${t ? `&token=${t}` : ''}`);
  };

  const handleContributed = async () => {
    setShowContribute(false);
    setContributed(true);
    setToast('Your memory has been added! ✓');
    localStorage.removeItem('lifescribe_capsule_invite');
    if (capsule) {
      const contribs = await base44.entities.CapsuleContribution.filter({ capsule_id: capsule.id });
      setContributions(contribs);
    }
  };

  if (loading || user === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token && !localStorage.getItem('lifescribe_capsule_invite')) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <Archive className="w-12 h-12 text-gray-200 mb-4" />
        <p className="text-gray-400 text-sm">Invalid or missing invite link.</p>
        <button onClick={() => router.push(createPageUrl('Home'))} className="mt-4 text-sm text-[#1A1A2E] underline font-medium">Go home</button>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <Archive className="w-12 h-12 text-gray-200 mb-4" />
        <p className="font-semibold text-[#1A1A2E] mb-1">Capsule not found</p>
        <p className="text-gray-400 text-sm">This invite link may have expired or been removed.</p>
        <button onClick={() => router.push(createPageUrl('Home'))} className="mt-4 text-sm text-[#1A1A2E] underline font-medium">Go home</button>
      </div>
    );
  }

  // ── Unauthenticated: sign-up wall ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
        <div className="bg-[#1A1A2E] px-6 pt-16 pb-10 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
            <Archive className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 leading-tight">{capsule.title}</h1>
          {capsule.description && (
            <p className="text-white/60 text-sm leading-relaxed mb-3">{capsule.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-white/50">
            {capsule.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(capsule.event_date), 'MMMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Memory Capsule
            </span>
          </div>
        </div>

        <div className="flex-1 px-6 pt-8 pb-10">
          <h2 className="text-lg font-bold text-[#111111] mb-2">You've been invited</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Someone special wants your perspective as part of this memory capsule. Sign up in seconds — no credit card needed.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { step: '1', text: 'Create your free account' },
              { step: '2', text: 'Add your memory or photo' },
              { step: '3', text: 'It's preserved forever' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1A1A2E] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</div>
                <p className="text-sm text-[#111111]">{text}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSignUp}
            className="w-full bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-12 text-base font-semibold flex items-center justify-center gap-2"
          >
            Add my perspective <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-xs text-gray-300 mt-3">3 months free · No credit card required</p>
        </div>
      </div>
    );
  }

  // ── Authenticated: show capsule + contribute ───────────────────────────────
  const isOpen = capsule.is_open !== false;

  if (contributed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Memory added!</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-xs">
          Your perspective has been added to <span className="text-[#111111] font-medium">{capsule.title}</span>.
        </p>
        <Button
          onClick={() => router.push(createPageUrl('CapsuleDetail') + `?id=${capsule.id}`)}
          className="w-full max-w-xs bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium"
        >
          View the capsule
        </Button>
        <button onClick={() => router.push(createPageUrl('Home'))} className="mt-3 text-sm text-gray-400 underline">Go to my vault</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#1A1A2E] px-6 pt-16 pb-8 text-white">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
          <Archive className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold mb-1">{capsule.title}</h1>
        {capsule.description && <p className="text-white/60 text-sm leading-relaxed mb-3">{capsule.description}</p>}
        <div className="flex items-center gap-4 text-xs text-white/50">
          {capsule.event_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(capsule.event_date), 'MMMM d, yyyy')}
            </span>
          )}
          {contributions.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {contributions.length} {contributions.length === 1 ? 'memory' : 'memories'}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-5">
        {isOpen ? (
          <Button
            onClick={() => setShowContribute(true)}
            className="w-full bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-12 text-base font-semibold flex items-center justify-center gap-2 mb-5"
          >
            Add my perspective <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center mb-5">
            <p className="text-sm font-medium text-amber-700">This capsule is closed</p>
            <p className="text-xs text-amber-500 mt-0.5">The creator has stopped accepting new contributions.</p>
          </div>
        )}

        {contributions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-400 px-1 uppercase tracking-wide">Contributions</p>
            {contributions.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                {c.content && <p className="text-sm text-[#111111] leading-relaxed mb-2">{c.content}</p>}
                {c.media_urls?.[0] && (
                  <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video mb-2">
                    <img src={c.media_urls[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[10px] text-gray-300">{c.contributor_name || 'Anonymous'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showContribute && (
        <AddContributionSheet
          open={showContribute}
          onClose={() => setShowContribute(false)}
          capsuleId={capsule.id}
          onAdded={handleContributed}
        />
      )}

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function CapsuleInvite() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <CapsuleInviteContent />
    </Suspense>
  );
}
