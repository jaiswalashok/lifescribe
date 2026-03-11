'use client';
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock } from 'lucide-react';
import MoodRingAvatar from './MoodRingAvatar';

export default function ConnectionRequestsSheet({ open, onClose }) {
  const queryClient = useQueryClient();

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-family-relationships'],
    queryFn: () => base44.entities.FamilyRelationship.filter({ status: 'pending' }),
    enabled: open,
  });

  const handleAccept = async (req) => {
    const user = await base44.auth.me();
    await base44.entities.FamilyRelationship.update(req.id, { status: 'linked', to_user_id: user.id });
    queryClient.invalidateQueries({ queryKey: ['pending-family-relationships'] });
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#111111]">Connection Requests</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No pending connection requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-3">
                      <MoodRingAvatar size={44} name={req.to_user_name || req.to_user_email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111111] truncate">
                          {req.to_user_name || req.to_user_email}
                        </p>
                        <p className="text-xs text-gray-400">Invited as {req.relationship}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(req)}
                          className="flex items-center gap-1 bg-[#111111] text-white text-xs font-medium px-3 py-1.5 rounded-full"
                        >
                          <Check className="w-3 h-3" />
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}