'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import Toast from '@/components/lifescribe/Toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function TrusteeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const trusteeId = searchParams.get('id');
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState('');

  const { data: trustees = [] } = useQuery({ queryKey: ['life_trustees'], queryFn: () => base44.entities.LifeTrustee.list() });
  const trustee = trustees.find(t => t.id === trusteeId);

  if (!trustee) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;

  const handleDelete = async () => {
    await base44.entities.LifeTrustee.delete(trusteeId);
    queryClient.invalidateQueries({ queryKey: ['life_trustees'] });
    setToast('Trustee removed.');
    setTimeout(() => router.push(createPageUrl('MemorialSettings')), 1000);
  };

  const permissionsLabel = trustee.permissions_type === 'full' ? 'Everything — full vault access' : trustee.permissions_type === 'specific_chapters' ? 'Specific chapters only' : 'Everything except selected chapters';
  const deliveryLabel = trustee.delivery_trigger === 'on_death' ? 'Upon confirmed death' : trustee.delivery_trigger === 'specific_date' ? `On ${trustee.delivery_detail}` : `On milestone: ${trustee.delivery_detail}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <button className="text-gray-400"><Pencil className="w-4 h-4" /></button>
      </div>
      <div className="px-6">
        <div className="flex flex-col items-center mb-8">
          <MoodRingAvatar src={trustee.trustee_avatar} mood={trustee.trustee_mood} size={56} name={trustee.trustee_name} />
          <h2 className="text-xl font-bold text-[#1A1A2E] mt-3">{trustee.trustee_name}</h2>
        </div>
        <div className="space-y-4 mb-8">
          <div className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Receives</p>
            <p className="text-sm font-medium text-[#111111]">{permissionsLabel}</p>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Delivery Condition</p>
            <p className="text-sm font-medium text-[#111111]">{deliveryLabel}</p>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Can pass on</p>
            <p className="text-sm font-medium text-[#111111]">{trustee.can_pass_on ? 'Yes' : 'No'}</p>
          </div>
          {trustee.delivery_message && (
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Personal message</p>
              <p className="text-sm text-[#111111] leading-relaxed">{trustee.delivery_message}</p>
            </div>
          )}
        </div>
        <Button onClick={() => setShowDelete(true)} variant="outline" className="w-full rounded-full h-12 text-sm border-red-200 text-red-500 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" /> Remove trustee
        </Button>
      </div>
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this trustee?</AlertDialogTitle><AlertDialogDescription>They will no longer inherit your vault.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function TrusteeDetail() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <TrusteeDetailContent />
    </Suspense>
  );
}
