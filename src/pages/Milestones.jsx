import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { ChevronLeft, Heart, Briefcase, Home as HomeIcon, Star } from 'lucide-react';
import EmptyState from '../components/lifescribe/EmptyState';

const TYPE_ICONS = {
  romantic: Heart,
  professional: Briefcase,
  family: HomeIcon,
  personal: Star,
};

const TYPE_COLORS = {
  romantic: 'bg-red-50 text-red-500',
  professional: 'bg-blue-50 text-blue-500',
  family: 'bg-green-50 text-green-500',
  personal: 'bg-amber-50 text-amber-500',
};

export default function Milestones() {
  const navigate = useNavigate();

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  // Sort by next anniversary
  const sorted = [...milestones].sort((a, b) => {
    const aDate = new Date(a.milestone_date);
    const bDate = new Date(b.milestone_date);
    const now = new Date();
    const aNext = new Date(now.getFullYear(), aDate.getMonth(), aDate.getDate());
    const bNext = new Date(now.getFullYear(), bDate.getMonth(), bDate.getDate());
    if (aNext < now) aNext.setFullYear(aNext.getFullYear() + 1);
    if (bNext < now) bNext.setFullYear(bNext.getFullYear() + 1);
    return aNext - bNext;
  });

  const getDaysUntil = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    let next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return differenceInDays(next, now);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Milestones</h1>
        </div>
        <p className="text-sm text-gray-400 ml-9">The moments that mark your journey.</p>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-12">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Star}
            message="No milestones yet. Add the moments that matter."
            ctaText="Add milestone"
            onAction={() => navigate(createPageUrl('AddMilestone'))}
          />
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {sorted.map(ms => {
                const Icon = TYPE_ICONS[ms.type] || Star;
                const colorClass = TYPE_COLORS[ms.type] || 'bg-gray-50 text-gray-500';
                const daysUntil = getDaysUntil(ms.milestone_date);

                return (
                  <button
                    key={ms.id}
                    onClick={() => navigate(createPageUrl('MilestoneDetail') + `?id=${ms.id}`)}
                    className="w-full bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center gap-4 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111111] truncate">{ms.title}</p>
                      <p className="text-xs text-gray-400">
                        {ms.milestone_date ? format(new Date(ms.milestone_date), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                    <span className="text-xs bg-[#F5F5F5] text-gray-500 px-2.5 py-1 rounded-full font-medium">
                      {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => navigate(createPageUrl('AddMilestone'))}
              className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium"
            >
              Add milestone
            </Button>
          </>
        )}
      </div>
    </div>
  );
}