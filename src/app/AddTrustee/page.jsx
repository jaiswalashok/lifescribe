'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '@/components/lifescribe/Toast';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AddTrustee() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedConn, setSelectedConn] = useState(null);
  const [permissionsType, setPermissionsType] = useState('full');
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [canPassOn, setCanPassOn] = useState(true);
  const [deliveryTrigger, setDeliveryTrigger] = useState('on_death');
  const [deliveryDetail, setDeliveryDetail] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: () => base44.entities.Connection.list() });
  const { data: chapters = [] } = useQuery({ queryKey: ['chapters'], queryFn: () => base44.entities.Chapter.list() });

  const filteredConns = searchQ ? connections.filter(c => c.connected_user_name?.toLowerCase().includes(searchQ.toLowerCase())) : connections;
  const toggleChapter = (id) => setSelectedChapterIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!selectedConn) return;
    setSaving(true);
    await base44.entities.LifeTrustee.create({
      trustee_user_id: selectedConn.connected_user_id || selectedConn.id,
      trustee_name: selectedConn.connected_user_name,
      trustee_avatar: selectedConn.connected_user_avatar || '',
      trustee_mood: selectedConn.connected_user_mood || '',
      permissions_type: permissionsType,
      chapter_ids: permissionsType !== 'full' ? selectedChapterIds : undefined,
      can_pass_on: canPassOn,
      delivery_trigger: deliveryTrigger,
      delivery_detail: deliveryDetail || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['life_trustees'] });
    setToast('Trustee saved.');
    setTimeout(() => router.push(createPageUrl('MemorialSettings')), 1200);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Add Trustee — Step {step} of 3</h1>
      </div>

      <div className="px-6">
        {step === 1 && (
          <div>
            <p className="text-sm text-gray-400 mb-4">Who will inherit your vault?</p>
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search connections"
              className="bg-[#F5F5F5] border-0 h-10 rounded-xl text-sm mb-3 text-[#111111] placeholder:text-gray-300" />
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredConns.map(conn => (
                <button key={conn.id} onClick={() => { setSelectedConn(conn); setStep(2); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${selectedConn?.id === conn.id ? 'bg-[#1A1A2E] text-white' : 'hover:bg-gray-50'}`}>
                  <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={40} name={conn.connected_user_name} />
                  <div>
                    <p className={`text-sm font-medium ${selectedConn?.id === conn.id ? 'text-white' : 'text-[#111111]'}`}>{conn.connected_user_name}</p>
                    {conn.relationship_label && <p className={`text-xs ${selectedConn?.id === conn.id ? 'text-gray-300' : 'text-gray-400'}`}>{conn.relationship_label}</p>}
                  </div>
                  <ChevronRight className={`w-4 h-4 ml-auto ${selectedConn?.id === conn.id ? 'text-white' : 'text-gray-300'}`} />
                </button>
              ))}
              {filteredConns.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No connections found.</p>}
            </div>
          </div>
        )}

        {step === 2 && selectedConn && (
          <div>
            <p className="text-sm text-gray-400 mb-4">What will {selectedConn.connected_user_name} receive?</p>
            <div className="space-y-2 mb-6">
              {[{ value: 'full', label: 'Everything', desc: 'Full vault access' }, { value: 'specific_chapters', label: 'Specific chapters only', desc: 'Choose which chapters' }, { value: 'exclude_chapters', label: 'Everything except', desc: 'Exclude specific chapters' }].map(opt => (
                <button key={opt.value} onClick={() => setPermissionsType(opt.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${permissionsType === opt.value ? 'border-[#1A1A2E] bg-[#FAFAFA]' : 'border-gray-100'}`}>
                  <p className="text-sm font-medium text-[#111111]">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
            {permissionsType !== 'full' && chapters.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 mb-2">Select chapters</p>
                <div className="space-y-1">
                  {chapters.map(ch => (
                    <button key={ch.id} onClick={() => toggleChapter(ch.id)}
                      className={`w-full p-3 rounded-xl text-left text-sm transition-all ${selectedChapterIds.includes(ch.id) ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-xl mb-6">
              <p className="text-sm text-[#111111]">Can pass vault on to their trustees</p>
              <button onClick={() => setCanPassOn(!canPassOn)} className={`w-11 h-6 rounded-full transition-colors ${canPassOn ? 'bg-[#1A1A2E]' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${canPassOn ? 'ml-[22px]' : 'ml-0.5'}`} />
              </button>
            </div>
            <Button onClick={() => setStep(3)} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium">Next</Button>
          </div>
        )}

        {step === 3 && selectedConn && (
          <div>
            <p className="text-sm text-gray-400 mb-4">When should {selectedConn.connected_user_name} receive this?</p>
            <div className="space-y-2 mb-6">
              {[{ value: 'on_death', label: 'Upon confirmed death', desc: 'Default and most common' }, { value: 'specific_date', label: 'On a specific date', desc: 'Choose a future date' }, { value: 'milestone', label: 'On a recipient milestone', desc: 'Their 18th birthday, wedding, etc.' }].map(opt => (
                <button key={opt.value} onClick={() => setDeliveryTrigger(opt.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${deliveryTrigger === opt.value ? 'border-[#1A1A2E] bg-[#FAFAFA]' : 'border-gray-100'}`}>
                  <p className="text-sm font-medium text-[#111111]">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
            {deliveryTrigger === 'specific_date' && (
              <div className="mb-6">
                <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Select date</Label>
                <Input type="date" value={deliveryDetail} onChange={e => setDeliveryDetail(e.target.value)} className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111]" />
              </div>
            )}
            {deliveryTrigger === 'milestone' && (
              <div className="mb-6">
                <Label className="text-xs font-medium text-gray-500 mb-2 block">Select milestone</Label>
                <div className="space-y-1">
                  {['Their 18th birthday', 'Their wedding day', 'One year after my death'].map(opt => (
                    <button key={opt} onClick={() => setDeliveryDetail(opt)}
                      className={`w-full p-3 rounded-xl text-left text-sm transition-all ${deliveryDetail === opt ? 'bg-[#1A1A2E] text-white' : 'bg-[#F5F5F5] text-[#111111]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40">
              {saving ? 'Saving...' : 'Save trustee'}
            </Button>
          </div>
        )}
      </div>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
