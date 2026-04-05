'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { findConnectionByToken } from '@/lib/entities';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Users, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '@/components/lifescribe/Toast';

function FriendInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [user, setUser] = useState(undefined);
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState(null); // 'accepted' | 'declined'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('lifescribe_friend_invite', token);
  }, [token]);

  useEffect(() => {
    if (user === undefined) return;
    const t = token || localStorage.getItem('lifescribe_friend_invite');
    if (!t) { setLoading(false); return; }

    (async () => {
      const conn = await findConnectionByToken(t);
      setConnection(conn);
      setLoading(false);
    })();
  }, [user, token]);

  const handleSignUp = () => {
    const t = token || localStorage.getItem('lifescribe_friend_invite');
    router.push(createPageUrl('CreateAccount') + `?next=friend-invite${t ? `&token=${t}` : ''}`);
  };

  const handleAccept = async () => {
    if (!connection || !user) return;
    setAccepting(true);
    try {
      await base44.entities.Connection.update(connection.id, {
        connected_user_id: user.uid,
        accepted: true,
        accepted_date: new Date().toISOString(),
      });
      // Create in-app notification for the inviter
      await base44.entities.Notification.create({
        notification_type: 'circle_accepted',
        title: `${user.displayName || user.email} accepted your circle invite`,
        message: `They've joined your circle.`,
        is_read: false,
      });
      localStorage.removeItem('lifescribe_friend_invite');
      setDone('accepted');
    } catch (err) {
      setToast('Failed to accept invite. Please try again.');
    }
    setAccepting(false);
  };

  const handleDecline = async () => {
    if (!connection) return;
    setDeclining(true);
    try {
      await base44.entities.Connection.delete(connection.id);
      localStorage.removeItem('lifescribe_friend_invite');
      setDone('declined');
    } catch {
      setToast('Failed to decline. Please try again.');
    }
    setDeclining(false);
  };

  if (loading || user === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <Users className="w-12 h-12 text-gray-200 mb-4" />
        <p className="font-semibold text-[#1A1A2E] mb-1">Invite not found</p>
        <p className="text-gray-400 text-sm mb-6">This invite link may have expired or already been used.</p>
        <button onClick={() => router.push(createPageUrl('Home'))} className="text-sm text-[#1A1A2E] underline font-medium">Go home</button>
      </div>
    );
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (done === 'accepted') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">You're in!</h1>
        <p className="text-sm text-gray-400 mb-8">You've joined <span className="font-medium text-[#111111]">{connection.connected_user_name || 'their'}</span>'s circle on Lifescribe.</p>
        <Button onClick={() => router.push(createPageUrl('Home'))} className="w-full max-w-xs bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium">
          Go to my vault
        </Button>
      </div>
    );
  }

  if (done === 'declined') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <XCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Invite declined</h1>
        <p className="text-sm text-gray-400 mb-8">No worries — you can always reconnect later.</p>
        <button onClick={() => router.push(createPageUrl('Home'))} className="text-sm text-[#1A1A2E] underline font-medium">Go home</button>
      </div>
    );
  }

  // ── Unauthenticated sign-up wall ───────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
        <div className="bg-[#1A1A2E] px-6 pt-16 pb-10 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 leading-tight">You've been invited to connect</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            <span className="text-white font-medium">{connection.connected_user_name}</span> wants to share memories with you on Lifescribe.
          </p>
        </div>

        <div className="flex-1 px-6 pt-8 pb-10">
          <h2 className="text-lg font-bold text-[#111111] mb-2">Create your free account</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Sign up in seconds to accept this invite and start preserving your own memories.
          </p>
          <div className="space-y-3 mb-8">
            {[
              { step: '1', text: 'Create your free account' },
              { step: '2', text: 'Accept the connection' },
              { step: '3', text: 'Share memories together' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1A1A2E] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</div>
                <p className="text-sm text-[#111111]">{text}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSignUp} className="w-full bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-12 text-base font-semibold flex items-center justify-center gap-2">
            Accept invite <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-xs text-gray-300 mt-3">3 months free · No credit card required</p>
        </div>
      </div>
    );
  }

  // ── Authenticated: show accept/decline ────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1A1A2E]/10 flex items-center justify-center mb-5">
        <Users className="w-8 h-8 text-[#1A1A2E]" />
      </div>
      <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Circle Invite</h1>
      <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">
        <span className="font-medium text-[#111111]">{connection.connected_user_name}</span> has invited you to join their circle and share memories on Lifescribe.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={handleAccept}
          disabled={accepting || declining}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium disabled:opacity-40"
        >
          {accepting ? 'Accepting…' : 'Accept invite'}
        </Button>
        <Button
          onClick={handleDecline}
          disabled={accepting || declining}
          variant="outline"
          className="w-full rounded-full h-12 text-sm border-gray-200 text-gray-500 disabled:opacity-40"
        >
          {declining ? 'Declining…' : 'Decline'}
        </Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function FriendInvite() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <FriendInviteContent />
    </Suspense>
  );
}
