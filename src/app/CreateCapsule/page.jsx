'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Toast from '@/components/lifescribe/Toast';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import { ChevronLeft, X, Users, Link as LinkIcon, Check } from 'lucide-react';
import VoiceInput from '@/components/lifescribe/VoiceInput';

export default function CreateCapsule() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [invitees, setInvitees] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [addMode, setAddMode] = useState('individual');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);

  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: () => base44.entities.Connection.list() });
  const { data: circles = [] } = useQuery({ queryKey: ['circles'], queryFn: () => base44.entities.Circle.list() });

  const filteredConnections = searchQ
    ? connections.filter(c => c.connected_user_name?.toLowerCase().includes(searchQ.toLowerCase()) && !invitees.find(inv => inv.id === c.id))
    : connections.filter(c => !invitees.find(inv => inv.id === c.id));

  const addInvitee = (conn) => { setInvitees(prev => prev.find(i => i.id === conn.id) ? prev : [...prev, conn]); setSearchQ(''); };
  const addCircle = (circle) => { const members = connections.filter(c => c.circle_id === circle.id); members.forEach(m => setInvitees(prev => prev.find(i => i.id === m.id) ? prev : [...prev, m])); };
  const removeInvitee = (id) => setInvitees(prev => prev.filter(i => i.id !== id));

  const handleSave = async () => {
    if (!title.trim() || !eventDate) return;
    setSaving(true);
    const token = Math.random().toString(36).substring(2, 15);
    await base44.entities.MomentCapsule.create({ title, event_date: eventDate, description: description || undefined, invite_link_token: token, contributor_count: invitees.length });
    setCreatedToken(token);
    queryClient.invalidateQueries({ queryKey: ['moment_capsules'] });
    setToast('Memory capsule created!');
    setSaving(false);
  };

  const copyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/capsule/join/${createdToken}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (createdToken) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#111111] mb-2">Capsule Created!</h2>
        <p className="text-sm text-gray-400 mb-6">Share the link below so others can join and contribute their memories.</p>
        <div className="w-full bg-[#F5F5F5] rounded-xl p-4 mb-4 text-left">
          <p className="text-xs text-gray-400 mb-1">Invite link</p>
          <p className="text-xs text-[#111111] break-all font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}/capsule/join/{createdToken}</p>
        </div>
        <Button onClick={copyLink} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium mb-3">
          <LinkIcon className="w-4 h-4 mr-2" />{linkCopied ? 'Link Copied!' : 'Copy Invite Link'}
        </Button>
        <button onClick={() => router.push(createPageUrl('Home'))} className="text-sm text-gray-400 underline">Back to home</button>
        <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">New Memory Capsule</h1>
      </div>

      <div className="px-6 space-y-5">
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Name this memory *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Farid's Wedding, Bali 2024…" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Event Date *</Label>
          <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-medium text-gray-500">Description</Label>
            <VoiceInput onTranscript={(text) => setDescription(prev => prev ? prev + ' ' + text : text)} />
          </div>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add some context about this shared memory…" className="bg-[#F5F5F5] border-0 rounded-xl text-[#111111] placeholder:text-gray-300 min-h-[80px]" />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-2 block">Invite Contributors</Label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setAddMode('individual')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${addMode === 'individual' ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
              <Users className="w-3 h-3" /> Individual
            </button>
            <button onClick={() => setAddMode('circle')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${addMode === 'circle' ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
              Add by Circle
            </button>
          </div>

          {invitees.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {invitees.map(inv => (
                <div key={inv.id} className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-full pl-1.5 pr-2 py-1">
                  <MoodRingAvatar src={inv.connected_user_avatar} mood={inv.connected_user_mood} size={20} name={inv.connected_user_name} />
                  <span className="text-xs text-[#111111]">{inv.connected_user_name}</span>
                  <button onClick={() => removeInvitee(inv.id)}><X className="w-3 h-3 text-gray-400" /></button>
                </div>
              ))}
            </div>
          )}

          {addMode === 'individual' && (
            <>
              <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search connections…" className="bg-[#F5F5F5] border-0 h-10 rounded-xl text-sm text-[#111111] placeholder:text-gray-300 mb-1" />
              <div className="max-h-44 overflow-y-auto rounded-xl bg-white border border-gray-100 shadow-sm">
                {filteredConnections.slice(0, 8).map(conn => (
                  <button key={conn.id} onClick={() => addInvitee(conn)} className="w-full flex items-center gap-2 p-2.5 hover:bg-gray-50 text-left">
                    <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={28} name={conn.connected_user_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111111]">{conn.connected_user_name}</p>
                      {conn.relationship_label && <p className="text-[10px] text-gray-400">{conn.relationship_label}</p>}
                    </div>
                    <Check className="w-4 h-4 text-gray-200" />
                  </button>
                ))}
              </div>
            </>
          )}

          {addMode === 'circle' && (
            <div className="space-y-2">
              {circles.length === 0 && <p className="text-xs text-gray-400">No circles yet.</p>}
              {circles.map(circle => {
                const members = connections.filter(c => c.circle_id === circle.id);
                return (
                  <button key={circle.id} onClick={() => addCircle(circle)} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F5] hover:bg-gray-100 transition-all text-left">
                    <div><p className="text-sm font-semibold text-[#111111]">{circle.name}</p><p className="text-xs text-gray-400">{members.length} members</p></div>
                    <div className="flex -space-x-1.5">{members.slice(0, 3).map((m, i) => <MoodRingAvatar key={i} src={m.connected_user_avatar} mood={m.connected_user_mood} size={22} name={m.connected_user_name} />)}</div>
                  </button>
                );
              })}
              <p className="text-xs text-gray-400 pt-1">You can also share an invite link after creating — anyone with the link can join.</p>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={!title.trim() || !eventDate || saving} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40">
          {saving ? 'Creating...' : 'Create capsule'}
        </Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
