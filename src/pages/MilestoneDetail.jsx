import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ChevronLeft, Pencil, Trash2, Heart, Briefcase, Home as HomeIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '../components/lifescribe/Toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TYPE_ICONS = { romantic: Heart, professional: Briefcase, family: HomeIcon, personal: Star };
const TYPE_COLORS = {
  romantic: 'bg-red-50 text-red-500',
  professional: 'bg-blue-50 text-blue-500',
  family: 'bg-green-50 text-green-500',
  personal: 'bg-amber-50 text-amber-500',
};

export default function MilestoneDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const milestoneId = urlParams.get('id');

  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState('');

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const ms = milestones.find(m => m.id === milestoneId);

  if (!ms) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = TYPE_ICONS[ms.type] || Star;
  const colorClass = TYPE_COLORS[ms.type] || 'bg-gray-50 text-gray-500';
  const msDate = new Date(ms.milestone_date);
  const years = differenceInYears(new Date(), msDate);
  const days = differenceInDays(new Date(), msDate) % 365;

  const handleDelete = async () => {
    await base44.entities.Milestone.delete(milestoneId);
    queryClient.invalidateQueries({ queryKey: ['milestones'] });
    setToast('Milestone deleted.');
    setTimeout(() => navigate(createPageUrl('Milestones')), 1000);
  };

  const handleWriteReflection = () => {
    const prompt = `It has been ${years} years since ${ms.title}. What does this mean to you now?`;
    navigate(createPageUrl('CreateEntry') + `?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <button className="text-gray-400"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setShowDelete(true)} className="text-gray-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} mb-4`}>
          <Icon className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{ms.title}</h1>
        <p className="text-sm text-gray-400 mb-4">{format(msDate, 'MMMM d, yyyy')}</p>

        <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
          <p className="text-2xl font-bold text-[#111111]">{years} <span className="text-base font-normal text-gray-400">years</span> {days} <span className="text-base font-normal text-gray-400">days</span></p>
          <p className="text-xs text-gray-400 mt-1">since this milestone</p>
        </div>

        {ms.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{ms.description}</p>
        )}

        {ms.reminder_days_before?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 mb-2">Reminders</p>
            <div className="flex flex-wrap gap-1.5">
              {ms.reminder_days_before.map(d => (
                <span key={d} className="px-2.5 py-1 bg-[#F5F5F5] rounded-full text-xs text-gray-500">
                  {d === 0 ? 'On the day' : d === 1 ? '1 day before' : d === 7 ? '1 week before' : '1 month before'}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleWriteReflection}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium"
        >
          Write a reflection
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete milestone?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}