'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RELATIONSHIPS = [
  { label: 'Father', emoji: '👨' },
  { label: 'Mother', emoji: '👩' },
  { label: 'Son', emoji: '👦' },
  { label: 'Daughter', emoji: '👧' },
  { label: 'Brother', emoji: '👱‍♂️' },
  { label: 'Sister', emoji: '👱‍♀️' },
  { label: 'Partner', emoji: '💑' },
  { label: 'Grandfather', emoji: '👴' },
  { label: 'Grandmother', emoji: '👵' },
  { label: 'Grand Son', emoji: '👦' },
  { label: 'Grand Daughter', emoji: '👧' },
  { label: 'Uncle', emoji: '🧔' },
  { label: 'Aunt', emoji: '👩' },
  { label: 'Nephew', emoji: '👦' },
  { label: 'Niece', emoji: '👧' },
  { label: 'Cousin', emoji: '🧑' },
];

// Inverse relationship map — what the other person should call you
const INVERSE = {
  Father: 'Son',       // if other is male — we'll simplify to Son/Daughter based on label
  Mother: 'Son',
  Son: 'Father',
  Daughter: 'Father',
  Brother: 'Brother',
  Sister: 'Brother',
  Partner: 'Partner',
  Grandfather: 'Grand Son',
  Grandmother: 'Grand Son',
  'Grand Son': 'Grandfather',
  'Grand Daughter': 'Grandfather',
  Uncle: 'Nephew',
  Aunt: 'Nephew',
  Nephew: 'Uncle',
  Niece: 'Uncle',
  Cousin: 'Cousin',
};

export default function AddFamilyMemberSheet({ open, onClose, circleId, onAdded }) {
  const [step, setStep] = useState('relationship'); // 'relationship' | 'details' | 'link'
  const [selectedRel, setSelectedRel] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setStep('relationship');
    setSelectedRel(null);
    setName('');
    setEmail('');
    setSaving(false);
    setDone(false);
    setInviteLink('');
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const user = await base44.auth.me();

    // Generate unique invite token
    const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create FamilyRelationship record
    await base44.entities.FamilyRelationship.create({
      from_user_id: user.id,
      to_user_name: name.trim(),
      to_user_email: email.trim() || undefined,
      relationship: selectedRel,
      status: 'pending',
      circle_id: circleId,
      invite_token: inviteToken,
    });

    // Also create a Connection record for immediate display
    await base44.entities.Connection.create({
      user_id: user.id,
      connected_user_name: name.trim(),
      relationship_label: selectedRel,
      circle_id: circleId,
    });

    // Generate invite link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/family-invite?token=${inviteToken}`;
    setInviteLink(link);

    // Send invite email via Resend if email provided
    if (email.trim()) {
      try {
        await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email.trim(),
            inviterName: user.full_name || 'Someone',
            inviteLink: link,
            type: 'family',
          }),
        });
      } catch {
        // email send failure is non-blocking
      }
    }

    setSaving(false);
    setStep('link');
    onAdded?.();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-end"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-white rounded-t-3xl px-6 pt-5 pb-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {step === 'details' && (
                <button onClick={() => setStep('relationship')} className="text-gray-400 mr-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-base font-semibold text-[#111111]">
                {done ? 'Member added!' : step === 'relationship' ? 'Select relationship' : `Add ${selectedRel}`}
              </h2>
            </div>
            <button onClick={handleClose} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'link' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-[#111111]">{name}</span> has been added as your {selectedRel}.
              </p>
              <p className="text-xs text-gray-400 mb-4">Share this invite link with them:</p>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-xs text-gray-600 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="flex-shrink-0 text-gray-400 hover:text-[#111111] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <Button onClick={handleClose} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium">
                Done
              </Button>
            </div>
          ) : step === 'relationship' ? (
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pb-2">
              {RELATIONSHIPS.map(r => (
                <button
                  key={r.label}
                  onClick={() => { setSelectedRel(r.label); setStep('details'); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-left transition-colors"
                >
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-sm font-medium text-[#111111]">{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 mb-2">
                You are adding someone as your <span className="font-semibold text-[#111111]">{selectedRel}</span>.
                They will see you as their <span className="font-semibold text-[#111111]">{INVERSE[selectedRel] || 'relative'}</span>.
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Their name *</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ahmad Rizal"
                  className="bg-[#F5F5F5] border-0 rounded-xl h-11 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Their email (optional)</label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="to send them an invite"
                  type="email"
                  className="bg-[#F5F5F5] border-0 rounded-xl h-11 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  When they sign up with this email, your family tree will link automatically and their relatives will be inferred.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium mt-2"
              >
                {saving ? 'Adding…' : `Add ${selectedRel}`}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}