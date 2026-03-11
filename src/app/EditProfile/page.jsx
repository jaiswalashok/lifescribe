'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Toast from '@/components/lifescribe/Toast';
import { ChevronLeft, Camera } from 'lucide-react';

const COUNTRIES = [
  { code: 'SG', name: 'Singapore', cities: ['Singapore'] },
  { code: 'MY', name: 'Malaysia', cities: ['Kuala Lumpur', 'Johor Bahru', 'Georgetown', 'Kota Kinabalu', 'Kuching'] },
  { code: 'ID', name: 'Indonesia', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'] },
  { code: 'TH', name: 'Thailand', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Khon Kaen'] },
  { code: 'VN', name: 'Vietnam', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'] },
  { code: 'PH', name: 'Philippines', cities: ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati'] },
  { code: 'US', name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { code: 'GB', name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'] },
  { code: 'AU', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
];

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const section = searchParams.get('section') || 'about me';

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('');

  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const { data: user } = useQuery({ queryKey: ['current_user'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    if (profiles.length > 0) {
      setForm(profiles[0]);
      if (profiles[0].current_location) {
        const country = COUNTRIES.find(c => c.cities.includes(profiles[0].current_location));
        if (country) setSelectedCountry(country.name);
      }
    }
  }, [profiles]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const getCurrentCitiesList = () => COUNTRIES.find(c => c.name === selectedCountry)?.cities || [];

  const handleSave = async () => {
    setSaving(true);
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, { ...form });
    }
    queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    setToast('Profile updated.');
    setSaving(false);
  };

  const title = section === 'about me' ? 'About Me' : section === 'location' ? 'Location' : section === 'relationship' ? 'Relationship Status' : 'Work';

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">{title}</h1>
      </div>

      <div className="px-6 space-y-5">
        {section === 'about me' && (
          <>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                {form.profile_picture_url ? (
                  <img src={form.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"><Camera className="w-8 h-8 text-gray-400" /></div>
                )}
                <label className="absolute bottom-0 right-0 bg-[#111111] text-white p-2 rounded-full cursor-pointer hover:bg-gray-800">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Full Name</Label>
              <Input value={user?.full_name || ''} disabled className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-gray-400" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Username</Label>
              <Input value={form.username || ''} onChange={e => handleChange('username', e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Date of Birth</Label>
              <Input type="date" value={form.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Phone</Label>
              <Input value={form.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="Phone number" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
            </div>
          </>
        )}

        {section === 'location' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Current Country</Label>
              <Select value={selectedCountry} onValueChange={v => { setSelectedCountry(v); handleChange('current_location', ''); }}>
                <SelectTrigger className="bg-[#F5F5F5] border-0 h-12 rounded-xl"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Current City</Label>
              <Select value={form.current_location || ''} onValueChange={v => handleChange('current_location', v)} disabled={!selectedCountry}>
                <SelectTrigger className="bg-[#F5F5F5] border-0 h-12 rounded-xl"><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>{getCurrentCitiesList().map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Hometown</Label>
              <Input value={form.hometown || ''} onChange={e => handleChange('hometown', e.target.value)} placeholder="Where are you from?" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
            </div>
          </>
        )}

        {section === 'relationship' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Status</Label>
              <Select value={form.relationship_status || ''} onValueChange={v => handleChange('relationship_status', v)}>
                <SelectTrigger className="bg-[#F5F5F5] border-0 h-12 rounded-xl"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="in_a_relationship">In a relationship</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="its_complicated">It's complicated</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Partner Name</Label>
              <Input value={form.relationship_partner_name || ''} onChange={e => handleChange('relationship_partner_name', e.target.value)} placeholder="Partner's name" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Since</Label>
              <Input type="date" value={form.relationship_since || ''} onChange={e => handleChange('relationship_since', e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
            </div>
          </>
        )}

        {section === 'work' && (
          <>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Position</Label>
              <Input value={form.work_position || ''} onChange={e => handleChange('work_position', e.target.value)} placeholder="Job title" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Company</Label>
              <Input value={form.work_company || ''} onChange={e => handleChange('work_company', e.target.value)} placeholder="Company name" className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] placeholder:text-gray-300" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Since</Label>
              <Input type="date" value={form.work_since || ''} onChange={e => handleChange('work_since', e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40 mt-4">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function EditProfile() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <EditProfileContent />
    </Suspense>
  );
}
