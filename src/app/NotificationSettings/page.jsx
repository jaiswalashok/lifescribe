'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Cake } from 'lucide-react';
import Toast from '@/components/lifescribe/Toast';
import { Button } from '@/components/ui/button';

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#1A1A2E]' : 'bg-gray-200'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'ml-[22px]' : 'ml-0.5'}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState({ follow_requests: true, follow_approvals: true, connection_posts: true, payment_reminders: true });
  const [upcomingDays, setUpcomingDays] = useState(30);
  const [toast, setToast] = useState('');

  const handleUpcomingDays = (days) => {
    setUpcomingDays(days);
    if (typeof localStorage !== 'undefined') localStorage.setItem('circles_upcoming_days', String(days));
  };

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Notifications</h1>
      </div>
      <div className="px-6 space-y-4">
        {[
          { key: 'follow_requests', label: 'Follow requests' },
          { key: 'follow_approvals', label: 'Follow approvals and rejections' },
          { key: 'connection_posts', label: 'Connection posts' },
          { key: 'payment_reminders', label: 'Payment reminders' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <span className="text-sm text-[#111111]">{item.label}</span>
            <Toggle value={settings[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
        <div className="pt-2 pb-1">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-[#111111]">Upcoming events window</span>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map(days => (
              <button key={days} onClick={() => handleUpcomingDays(days)}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${upcomingDays === days ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
                {days} days
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setToast('Settings saved.')} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium mt-6">Save</Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
