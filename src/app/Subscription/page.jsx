'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, addDays } from 'date-fns';

export default function Subscription() {
  const router = useRouter();

  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};
  const effectivePlanType = profile.plan_type || (typeof window !== 'undefined' ? localStorage.getItem('lifescribe_plan') : null) || 'free';
  const isTrial = effectivePlanType === 'free_trial';
  const isPlus = effectivePlanType === 'legacy_plus';
  const isFamily = effectivePlanType === 'family_legacy';

  const trialStart = profile.trial_start_date ? new Date(profile.trial_start_date) : new Date();
  const trialEnd = addDays(trialStart, 14);
  const daysLeft = Math.max(0, differenceInDays(trialEnd, new Date()));

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Subscription</h1>
      </div>

      <div className="px-6">
        <div className="bg-[#F5F5F5] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#111111]">
                {isTrial ? 'Free Trial' : isPlus ? 'Legacy Plus' : isFamily ? 'Family Legacy' : 'Free'}
              </p>
              <p className="text-xs text-gray-400">
                {isTrial ? `Expiring in ${daysLeft} days` : isPlus ? 'MYR 7.99/month' : isFamily ? 'MYR 77.99/month' : 'No active plan'}
              </p>
            </div>
          </div>

          {isTrial && (
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Trial started</span><span className="font-medium text-[#111111]">{format(trialStart, 'MMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span>Expires on</span><span className="font-medium text-[#111111]">{format(trialEnd, 'MMM d, yyyy')}</span></div>
            </div>
          )}

          {(isPlus || isFamily) && (
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Active since</span><span className="font-medium text-[#111111]">{format(trialStart, 'MMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span>Monthly price</span><span className="font-medium text-[#111111]">{isPlus ? 'MYR 7.99' : 'MYR 77.99'}</span></div>
            </div>
          )}
        </div>

        {(isTrial || !profile.plan_type || profile.plan_type === 'free') && (
          <Button onClick={() => router.push(createPageUrl('Paywall'))} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium">
            Upgrade Plan
          </Button>
        )}
      </div>
    </div>
  );
}
