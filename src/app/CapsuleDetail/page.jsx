'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, Share2, Plus, Lock, Unlock, MoreVertical, Users, Trash2, Check } from 'lucide-react';
import BottomSheet from '@/components/lifescribe/BottomSheet';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Toast from '@/components/lifescribe/Toast';
import EmptyState from '@/components/lifescribe/EmptyState';
import CapsuleContributionCard from '@/components/lifescribe/CapsuleContributionCard';
import AddContributionSheet from '@/components/lifescribe/AddContributionSheet';

function CapsuleDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const capsuleId = searchParams.get('id');
  const [toast, setToast] = useState('');
  const [showContribute, setShowContribute] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [showManageContributors, setShowManageContributors] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [showShareToCircle, setShowShareToCircle] = useState(false);
  const [savingCircles, setSavingCircles] = useState(false);
  const [selectedCircleIds, setSelectedCircleIds] = useState([]);

  const { data: capsules = [], refetch: refetchCapsules } = useQuery({ queryKey: ['moment_capsules'], queryFn: () => base44.entities.MomentCapsule.list() });
  const { data: circles = [] } = useQuery({ queryKey: ['circles'], queryFn: () => base44.entities.Circle.list() });
  const { data: contributions = [], refetch } = useQuery({
    queryKey: ['capsule_contributions', capsuleId],
    queryFn: () => base44.entities.CapsuleContribution.filter({ capsule_id: capsuleId }),
    enabled: !!capsuleId,
  });

  const capsule = capsules.find(c => c.id === capsuleId);

  const handleToggleOpen = async () => {
    setTogglingOpen(true);
    await base44.entities.MomentCapsule.update(capsule.id, { is_open: !capsule.is_open });
    await refetchCapsules();
    setToast(capsule.is_open ? 'Contributions closed.' : 'Contributions reopened.');
    setTogglingOpen(false);
  };

  // Sync selected circles from capsule record
  React.useEffect(() => {
    if (capsule?.circle_ids?.length) setSelectedCircleIds(capsule.circle_ids);
  }, [capsule?.id]);

  if (!capsule) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;

  const handleSaveCircles = async () => {
    setSavingCircles(true);
    await base44.entities.MomentCapsule.update(capsule.id, { circle_ids: selectedCircleIds });
    await refetchCapsules();
    setToast('Capsule sharing updated.');
    setSavingCircles(false);
    setShowShareToCircle(false);
  };

  const handleRemoveContributor = async (contrib) => {
    setRemovingId(contrib.id);
    try {
      await base44.entities.CapsuleContribution.delete(contrib.id);
      await refetch();
      setToast(`Removed ${contrib.contributor_name || 'contributor'}.`);
    } catch {
      setToast('Could not remove contributor.');
    }
    setRemovingId(null);
  };

  const handleShareLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/CapsuleInvite?token=${capsule.invite_link_token}`);
      setToast('Link copied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1A1A2E] truncate">{capsule.title}</h1>
            <p className="text-xs text-gray-400">
              {capsule.event_date ? format(new Date(capsule.event_date), 'MMMM d, yyyy') : ''}
              {contributions.length > 0 && ` · ${contributions.length} memories`}
            </p>
          </div>
          <button onClick={handleShareLink} className="text-gray-400 flex-shrink-0"><Share2 className="w-5 h-5" /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 flex-shrink-0"><MoreVertical className="w-5 h-5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleOpen} disabled={togglingOpen}>
                {capsule.is_open !== false ? <><Lock className="w-4 h-4 mr-2" /> Close contributions</> : <><Unlock className="w-4 h-4 mr-2" /> Reopen contributions</>}
              </DropdownMenuItem>
              {circles.length > 0 && (
                <DropdownMenuItem onClick={() => setShowShareToCircle(true)}>
                  <Users className="w-4 h-4 mr-2" /> Share to circles
                </DropdownMenuItem>
              )}
              {contributions.length > 0 && (
                <DropdownMenuItem onClick={() => setShowManageContributors(true)}>
                  <Users className="w-4 h-4 mr-2" /> Manage contributors
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {contributions.length > 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Contributors</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[...new Map(contributions.map(c => [c.contributor_name, c])).values()].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {c.contributor_avatar ? <img src={c.contributor_avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-semibold text-gray-500">{c.contributor_name?.charAt(0).toUpperCase()}</span>}
                </div>
                <p className="text-[10px] text-gray-500 max-w-[52px] truncate text-center">{c.contributor_name?.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-28 space-y-4">
        {contributions.length === 0 ? (
          <EmptyState message="No memories yet. Be the first to contribute." ctaText="Add your memory" onAction={() => setShowContribute(true)} />
        ) : (
          contributions.map(contrib => <CapsuleContributionCard key={contrib.id} contrib={contrib} />)
        )}
      </div>

      {capsule.is_open === false ? (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20">
          <div className="bg-gray-100 text-gray-500 rounded-full h-12 px-6 text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" /> Contributions closed
          </div>
        </div>
      ) : (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20">
          <Button onClick={() => setShowContribute(true)} className="bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 px-6 text-sm font-medium shadow-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add your memory
          </Button>
        </div>
      )}

      <AddContributionSheet open={showContribute} onClose={() => setShowContribute(false)} capsuleId={capsuleId}
        onAdded={() => { queryClient.invalidateQueries({ queryKey: ['capsule_contributions', capsuleId] }); setToast('Memory added!'); }} />

      <BottomSheet open={showShareToCircle} onClose={() => setShowShareToCircle(false)} title="Share to circles">
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">Circle members will be able to view this capsule in their feed.</p>
        <div className="space-y-1 mb-5">
          {circles.map(circle => {
            const selected = selectedCircleIds.includes(circle.id);
            return (
              <button
                key={circle.id}
                onClick={() => setSelectedCircleIds(prev =>
                  selected ? prev.filter(id => id !== circle.id) : [...prev, circle.id]
                )}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${selected ? 'bg-[#1A1A2E]' : 'bg-[#F5F5F5]'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selected ? 'bg-white/20 text-white' : 'bg-white text-[#1A1A2E]'}`}>
                  {circle.name?.charAt(0).toUpperCase()}
                </div>
                <p className={`text-sm font-medium flex-1 ${selected ? 'text-white' : 'text-[#111111]'}`}>{circle.name}</p>
                {selected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        <Button
          onClick={handleSaveCircles}
          disabled={savingCircles}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium disabled:opacity-40"
        >
          {savingCircles ? 'Saving…' : 'Save sharing settings'}
        </Button>
      </BottomSheet>

      <BottomSheet open={showManageContributors} onClose={() => setShowManageContributors(false)} title="Manage contributors">
        <div className="space-y-1 pb-2">
          {[...new Map(contributions.map(c => [c.contributor_name, c])).values()].map(contrib => (
            <div key={contrib.id} className="flex items-center gap-3 p-3 rounded-xl">
              <MoodRingAvatar src={contrib.contributor_avatar} size={40} name={contrib.contributor_name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">{contrib.contributor_name || 'Anonymous'}</p>
                <p className="text-xs text-gray-400">{contrib.content ? contrib.content.slice(0, 40) + (contrib.content.length > 40 ? '…' : '') : 'Photo/media'}</p>
              </div>
              <button
                onClick={() => handleRemoveContributor(contrib)}
                disabled={removingId === contrib.id}
                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {removingId === contrib.id
                  ? <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
          {contributions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No contributors yet.</p>}
        </div>
      </BottomSheet>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function CapsuleDetail() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <CapsuleDetailContent />
    </Suspense>
  );
}
