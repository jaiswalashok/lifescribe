'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddFriendsSheet({ open, onClose, circleId, onAdded, isFamily }) {
  const [step, setStep] = useState('details'); // 'details' | 'link'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const reset = () => {
    setStep('details');
    setName('');
    setEmail('');
    setSaving(false);
    setInviteLink('');
    setCopied(false);
    setEmailSent(false);
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

    // Create a Connection record
    await base44.entities.Connection.create({
      user_id: user.id,
      connected_user_name: name.trim(),
      circle_id: circleId,
      invite_token: inviteToken,
    });

    // Generate invite link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/friend-invite?token=${inviteToken}`;
    setInviteLink(link);

    // Send email invite via Resend if email provided
    if (email.trim()) {
      try {
        await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email.trim(),
            inviterName: user.full_name || user.email,
            inviteLink: link,
            type: isFamily ? 'family' : 'friend',
          }),
        });
        setEmailSent(true);
      } catch {}
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
            <h2 className="text-base font-semibold text-[#111111]">
              {step === 'link' ? 'Invite sent!' : isFamily ? 'Invite family member' : 'Invite a friend'}
            </h2>
            <button onClick={handleClose} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'link' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-[#111111]">{name}</span> has been invited.
              </p>
              {emailSent && <p className="text-xs text-green-600 mb-2">✓ Invite email sent to {email}</p>}
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
          ) : (
            <div className="space-y-4">
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
                <label className="text-xs font-medium text-gray-400 mb-1 block">Their email <span className="text-gray-300">(optional — sends invite automatically)</span></label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. ahmad@example.com"
                  className="bg-[#F5F5F5] border-0 rounded-xl h-11 text-sm"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium mt-2"
              >
                {saving ? 'Creating invite…' : 'Generate invite link'}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}