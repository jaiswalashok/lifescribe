'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [toast, setToast] = useState('');

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
        <Button onClick={() => setToast('Password changed.')} disabled={!current || !newPass || newPass !== confirm}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium disabled:opacity-40">Save</Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
