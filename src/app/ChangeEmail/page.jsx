'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';
import { auth } from '@/lib/firebase';
import { verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function ChangeEmail() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [toast, setToast] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newEmail) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) { setToast('Not signed in.'); setSaving(false); return; }
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, newEmail);
      setToast(`Verification email sent to ${newEmail}. Click the link to confirm.`);
      setCurrentPassword('');
      setNewEmail('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setToast('Current password is incorrect.');
      } else if (err.code === 'auth/invalid-email') {
        setToast('Invalid email address.');
      } else {
        setToast(err.message || 'Failed to update email.');
      }
    }
    setSaving(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentEmail(user.email || '');
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Change Email</h1>
      </div>
      <div className="px-6 space-y-5">
        {currentEmail && (
          <div className="bg-[#F5F5F5] rounded-xl p-3">
            <p className="text-xs text-gray-500">Current email</p>
            <p className="text-sm text-[#111111] font-medium">{currentEmail}</p>
          </div>
        )}
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Current Password</Label>
          <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">New Email</Label>
          <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
        </div>
        <Button onClick={handleSave} disabled={!currentPassword || !newEmail || saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium disabled:opacity-40">
          {saving ? 'Sending…' : 'Update email'}
        </Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
