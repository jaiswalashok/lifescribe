'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { BookOpen, Gift, X } from 'lucide-react';

export default function CreatePostModal({ open, onClose }) {
  const router = useRouter();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          exit={{ y: 200 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-white rounded-t-3xl p-6 pb-10"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#111111]">What would you like to create?</h2>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { onClose(); router.push(createPageUrl('CreateEntry')); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-gray-100 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111]">Diary Entry</p>
                <p className="text-xs text-gray-400 mt-0.5">Write a private or shared journal entry for yourself</p>
              </div>
            </button>

            <button
              onClick={() => { onClose(); router.push(createPageUrl('CreateCapsule')); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-gray-100 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111]">Memory Capsule</p>
                <p className="text-xs text-gray-400 mt-0.5">Invite friends & family to build a shared memory together</p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}