'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';
import { auth } from '@/lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSave = async () => {
    if (!current || !newPass || newPass !== confirm) return;
    if (newPass.length < 6) { setToast('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      setToast('Password changed successfully.');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setToast('Current password is incorrect.');
      } else {
        setToast(err.message || 'Failed to change password.');
      }
    }
    setSaving(false);
  };

  const handleForgotPassword = async () => {
    const user = auth.currentUser;
    if (!user?.email) { setToast('No email found for your account.'); return; }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setToast(`Reset link sent to ${user.email}`);
    } catch (err) {
      setToast(err.message || 'Failed to send reset email.');
    }
    setSendingReset(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Change Password</h1>
      </div>
      <div className="px-6 space-y-5">
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Current Password</Label>
          <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">New Password</Label>
          <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Confirm New Password</Label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>
        <Button onClick={handleSave} disabled={!current || !newPass || newPass !== confirm || saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
        </div>

        <button onClick={handleForgotPassword} disabled={sendingReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-[#111111] transition-colors disabled:opacity-50">
          <Mail className="w-4 h-4" />
          {sendingReset ? 'Sending…' : 'Send password reset link to my email'}
        </button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
