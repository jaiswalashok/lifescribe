import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, Share2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '../components/lifescribe/Toast';
import EmptyState from '../components/lifescribe/EmptyState';
import CapsuleContributionCard from '../components/lifescribe/CapsuleContributionCard';
import AddContributionSheet from '../components/lifescribe/AddContributionSheet';

export default function CapsuleDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const capsuleId = urlParams.get('id');
  const [toast, setToast] = useState('');
  const [showContribute, setShowContribute] = useState(false);

  const { data: capsules = [] } = useQuery({
    queryKey: ['moment_capsules'],
    queryFn: () => base44.entities.MomentCapsule.list(),
  });

  const { data: contributions = [], refetch } = useQuery({
    queryKey: ['capsule_contributions', capsuleId],
    queryFn: () => base44.entities.CapsuleContribution.filter({ capsule_id: capsuleId }),
    enabled: !!capsuleId,
  });

  const capsule = capsules.find(c => c.id === capsuleId);

  if (!capsule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?invite=${capsule.invite_link_token}`);
    setToast('Link copied.');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1A1A2E] truncate">{capsule.title}</h1>
            <p className="text-xs text-gray-400">
              {capsule.event_date ? format(new Date(capsule.event_date), 'MMMM d, yyyy') : ''}
              {contributions.length > 0 && ` · ${contributions.length} memories`}
            </p>
          </div>
          <button onClick={handleShareLink} className="text-gray-400 flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contributors strip */}
      {contributions.length > 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Contributors</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[...new Map(contributions.map(c => [c.contributor_name, c])).values()].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {c.contributor_avatar ? (
                    <img src={c.contributor_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">
                      {c.contributor_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 max-w-[52px] truncate text-center">{c.contributor_name?.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 pt-4 pb-28 space-y-4">
        {contributions.length === 0 ? (
          <EmptyState
            message="No memories yet. Be the first to contribute."
            ctaText="Add your memory"
            onAction={() => setShowContribute(true)}
          />
        ) : (
          contributions.map(contrib => (
            <CapsuleContributionCard key={contrib.id} contrib={contrib} />
          ))
        )}
      </div>

      {/* Floating add button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20">
        <Button
          onClick={() => setShowContribute(true)}
          className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 px-6 text-sm font-medium shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add your memory
        </Button>
      </div>

      <AddContributionSheet
        open={showContribute}
        onClose={() => setShowContribute(false)}
        capsuleId={capsuleId}
        onAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['capsule_contributions', capsuleId] });
          setToast('Memory added!');
        }}
      />

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}