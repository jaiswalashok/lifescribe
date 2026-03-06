import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Briefcase, Trash2, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import MoodRingAvatar from './MoodRingAvatar';
import { getMoodLabel } from './constants';

export default function ConnectionProfile({ connection, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRegenerateLink, setShowRegenerateLink] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete?.();
  };

  const handleRegenerateLink = async () => {
    setIsRegenerating(true);
    try {
      const { data } = await base44.functions.invoke('regenerateInviteLink', {
        familyRelationshipId: connection.id,
      });
      setNewLink(data.invite_link);
      setShowRegenerateLink(true);
    } catch (error) {
      console.error('Error regenerating link:', error);
    }
    setIsRegenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPending = !connection.to_user_id;
  if (!connection) return null;

  // Mock extra profile data per connection
  const EXTRA = {
    janechia: { location: 'Kuala Lumpur, Malaysia', work: 'Interior Designer @ Studio J', bio: 'Life is better with good coffee and great design.' },
    faridazman: { location: 'Tokyo, Japan (traveling)', work: 'Software Engineer @ TechAsia', bio: 'Traveler. Runner. Coffee snob.' },
    zaramalik: { location: 'Petaling Jaya, Malaysia', work: 'Journalist @ The Edge', bio: 'Words are how I make sense of the world.' },
    danieltan: { location: 'Subang Jaya, Malaysia', work: 'Personal Trainer', bio: 'Consistency beats intensity. Every time.' },
    amirayusof: { location: 'Georgetown, Penang', work: 'Architect @ Amira & Co.', bio: 'Spaces shape people. People shape spaces.' },
    aimanhashim: { location: 'Penang, Malaysia', work: 'Retired Civil Servant', bio: 'Proud father. Lifelong learner.' },
    nurulhashim: { location: 'Penang, Malaysia', work: 'Homemaker & Caterer', bio: 'My kitchen is my sanctuary.' },
    ridhwanhashim: { location: 'Kuala Lumpur, Malaysia', work: 'Student', bio: 'Dinosaurs and football are life.' },
    sophiahashim: { location: 'Kuala Lumpur, Malaysia', work: 'Student', bio: 'Future artist in the making.' },
    hajihashim: { location: 'Penang, Malaysia', work: 'Retired', bio: 'Alhamdulillah for everything.' },
  };

  const extra = EXTRA[connection.username] || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <MoodRingAvatar
              src={connection.connected_user_avatar}
              mood={connection.connected_user_mood}
              size={60}
              name={connection.connected_user_name}
            />
            <div>
              <h2 className="text-lg font-bold text-[#111111]">{connection.connected_user_name}</h2>
              <p className="text-sm text-gray-400">@{connection.username || 'user'}</p>
              {connection.relationship_label && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {connection.relationship_label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {connection.connected_user_mood && (
          <div className="bg-[#F5F5F5] rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-gray-400 mb-0.5">Current mood</p>
            <p className="text-sm font-medium text-[#111111]">{getMoodLabel(connection.connected_user_mood)}</p>
          </div>
        )}

        {extra.bio && (
          <p className="text-sm text-gray-500 italic mb-4">"{extra.bio}"</p>
        )}

        <div className="space-y-2.5 mb-6">
           {extra.location && (
             <div className="flex items-center gap-2.5 text-sm text-gray-600">
               <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
               <span>{extra.location}</span>
             </div>
           )}
           {extra.work && (
             <div className="flex items-center gap-2.5 text-sm text-gray-600">
               <Briefcase className="w-4 h-4 text-gray-300 flex-shrink-0" />
               <span>{extra.work}</span>
             </div>
           )}
         </div>

         <div className="flex gap-2">
           {isPending && (
             <Button
               onClick={handleRegenerateLink}
               disabled={isRegenerating}
               className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full h-11 text-sm font-medium flex items-center justify-center gap-2"
             >
               <RefreshCw className="w-4 h-4" />
               {isRegenerating ? 'Regenerating…' : 'Regenerate link'}
             </Button>
           )}
           {onDelete && (
             <Button
               onClick={handleDelete}
               disabled={isDeleting}
               className={`${isPending ? 'flex-1' : 'w-full'} bg-red-50 text-red-600 hover:bg-red-100 rounded-full h-11 text-sm font-medium flex items-center justify-center gap-2`}
             >
               <Trash2 className="w-4 h-4" />
               {isDeleting ? 'Removing…' : 'Remove'}
             </Button>
           )}
         </div>

         {/* Regenerate link modal */}
         {showRegenerateLink && newLink && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             onClick={() => setShowRegenerateLink(false)}
           >
             <motion.div
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.9 }}
               className="bg-white rounded-2xl p-6 w-full max-w-sm"
               onClick={e => e.stopPropagation()}
             >
               <h3 className="text-base font-semibold text-[#111111] mb-2">New invite link</h3>
               <p className="text-sm text-gray-500 mb-4">Share this updated link with {connection.connected_user_name}:</p>

               <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                 <input
                   type="text"
                   value={newLink}
                   readOnly
                   className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate"
                 />
                 <button
                   onClick={copyToClipboard}
                   className="flex-shrink-0 text-gray-400 hover:text-[#111111] transition-colors"
                 >
                   {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 </button>
               </div>

               <Button
                 onClick={() => setShowRegenerateLink(false)}
                 className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium"
               >
                 Done
               </Button>
             </motion.div>
           </motion.div>
         )}
         </motion.div>
         </motion.div>
         );
         }