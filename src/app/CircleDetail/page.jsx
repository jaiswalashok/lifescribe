'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search, MoreVertical, UserPlus, Pencil, Trash2, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import FamilyTree from '@/components/lifescribe/FamilyTree';
import { inferRelatives } from '@/components/lifescribe/inferFamilyTree';
import BottomSheet from '@/components/lifescribe/BottomSheet';
import EmptyState from '@/components/lifescribe/EmptyState';
import ConnectionProfile from '@/components/lifescribe/ConnectionProfile';
import AddFamilyMemberSheet from '@/components/lifescribe/AddFamilyMemberSheet';
import AddFriendsSheet from '@/components/lifescribe/AddFriendsSheet';
import { AnimatePresence } from 'framer-motion';

function CircleDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const circleId = searchParams.get('id');
  const isUnclassified = searchParams.get('type') === 'unclassified';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConn, setSelectedConn] = useState(null);
  const [showNodeSheet, setShowNodeSheet] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showFamilyAddSheet, setShowFamilyAddSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: circles = [] } = useQuery({ queryKey: ['circles'], queryFn: () => base44.entities.Circle.list() });
  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: () => base44.entities.Connection.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const { data: allRelationships = [] } = useQuery({ queryKey: ['family_relationships'], queryFn: () => base44.entities.FamilyMember.list() });

  const circle = isUnclassified ? { name: 'Unclassified', circle_type: 'custom' } : circles.find(c => c.id === circleId);
  const members = isUnclassified ? connections.filter(c => !c.circle_id) : connections.filter(c => c.circle_id === circleId);
  const filteredMembers = searchQuery ? members.filter(m => m.connected_user_name?.toLowerCase().includes(searchQuery.toLowerCase())) : members;
  const isFamily = circle?.circle_type === 'family';
  const selfProfile = profiles[0] || {};

  const handleSaveName = async () => {
    if (!editName.trim() || !circleId) return;
    setIsSaving(true);
    await base44.entities.Circle.update(circleId, { name: editName.trim() });
    queryClient.invalidateQueries({ queryKey: ['circles'] });
    setIsSaving(false);
    setShowEditSheet(false);
  };

  const handleDeleteCircle = async () => {
    if (!circleId) return;
    await base44.entities.Circle.delete(circleId);
    queryClient.invalidateQueries({ queryKey: ['circles'] });
    router.back();
  };

  const handleTogglePrivacy = async () => {
    if (!circleId || !circle) return;
    const newPrivacy = circle.privacy_setting === 'private' ? 'connections' : 'private';
    await base44.entities.Circle.update(circleId, { privacy_setting: newPrivacy });
    queryClient.invalidateQueries({ queryKey: ['circles'] });
  };

  const handleDeleteConnection = async (connectionId) => {
    await base44.entities.Connection.delete(connectionId);
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    setShowNodeSheet(false);
  };

  const enrichedFamilyConnections = React.useMemo(() => {
    if (!isFamily || !selfProfile.user_id) return filteredMembers;
    const inferredMap = inferRelatives(selfProfile.user_id, allRelationships, filteredMembers);
    const result = [...filteredMembers];
    const directIds = new Set(filteredMembers.map(m => m.connected_user_id).filter(Boolean));
    for (const [userId, info] of inferredMap.entries()) {
      if (!directIds.has(userId) && info.isInferred) {
        result.push({ id: `inferred_${userId}`, connected_user_id: userId, connected_user_name: info.name, connected_user_avatar: info.avatar, connected_user_mood: info.mood, relationship_label: info.relationship });
      }
    }
    return result;
  }, [isFamily, selfProfile.user_id, filteredMembers, allRelationships]);

  if (!circle && !isUnclassified) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold text-[#1A1A2E]">{circle?.name}</h1>
          </div>
          {!isUnclassified && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="text-gray-400"><MoreVertical className="w-5 h-5" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditName(circle?.name || ''); setShowEditSheet(true); }}><Pencil className="w-4 h-4 mr-2" /> Rename circle</DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePrivacy}>
                  {circle?.privacy_setting === 'private' ? <><Globe className="w-4 h-4 mr-2" /> Make visible to connections</> : <><Lock className="w-4 h-4 mr-2" /> Make private</>}
                </DropdownMenuItem>
                {!isFamily && <DropdownMenuItem onClick={handleDeleteCircle} className="text-red-500 focus:text-red-500"><Trash2 className="w-4 h-4 mr-2" /> Delete circle</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search"
            className="bg-[#F5F5F5] border-0 h-10 rounded-xl pl-9 text-sm text-[#111111] placeholder:text-gray-300" />
        </div>
      </div>

      <div className="px-4 pt-4 pb-12">
        {isFamily ? (
          <>
            <div className="mb-4 p-3 bg-white rounded-xl flex items-center justify-between text-sm">
              <span className="text-gray-600">{circle?.privacy_setting === 'private' ? '🔒 Private' : '👥 Visible to connections'}</span>
              <button onClick={handleTogglePrivacy} className="text-[#111111] font-medium hover:text-gray-600 transition-colors">Change</button>
            </div>
            <FamilyTree connections={enrichedFamilyConnections} selfProfile={selfProfile}
              onTapNode={(conn) => { setSelectedConn(conn); setShowNodeSheet(true); }} onAddNode={() => setShowFamilyAddSheet(true)} />
            <Button onClick={() => setShowFamilyAddSheet(true)} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium mt-6">
              <UserPlus className="w-4 h-4 mr-2" /> Invite family member
            </Button>
          </>
        ) : (
          <>
            {filteredMembers.length === 0 ? (
              <EmptyState message="No members yet. Invite someone to this circle." ctaText="Invite member" onAction={() => setShowAddSheet(true)} />
            ) : (
              <div className="space-y-1">
                {filteredMembers.map(conn => (
                  <button key={conn.id} onClick={() => { setSelectedConn(conn); setShowNodeSheet(true); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors text-left">
                    <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={40} name={conn.connected_user_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{conn.connected_user_name}</p>
                      <p className="text-xs text-gray-400">@{conn.username || 'user'}</p>
                    </div>
                    {conn.relationship_label && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{conn.relationship_label}</span>}
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => setShowAddSheet(true)} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-medium mt-6">
              <UserPlus className="w-4 h-4 mr-2" /> Invite member
            </Button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showNodeSheet && selectedConn && <ConnectionProfile connection={selectedConn} onClose={() => setShowNodeSheet(false)} onDelete={() => handleDeleteConnection(selectedConn.id)} />}
      </AnimatePresence>
      <AddFriendsSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} circleId={circleId} onAdded={() => queryClient.invalidateQueries({ queryKey: ['connections'] })} />
      <BottomSheet open={showEditSheet} onClose={() => setShowEditSheet(false)} title="Rename circle">
        <div className="space-y-4">
          <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Circle name" className="h-11 rounded-xl border-gray-200 text-sm" />
          <Button onClick={handleSaveName} disabled={!editName.trim() || isSaving} className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </BottomSheet>
      <AddFamilyMemberSheet open={showFamilyAddSheet} onClose={() => setShowFamilyAddSheet(false)} circleId={circleId} onAdded={() => queryClient.invalidateQueries({ queryKey: ['connections'] })} />
    </div>
  );
}

export default function CircleDetail() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <CircleDetailContent />
    </Suspense>
  );
}
