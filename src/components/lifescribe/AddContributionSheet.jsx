'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Video, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VoiceInput from '@/components/lifescribe/VoiceInput';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddContributionSheet({ open, onClose, capsuleId, onAdded }) {
  const [mediaFiles, setMediaFiles] = useState([]); // [{ file, previewUrl, type }]
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  const reset = () => {
    setMediaFiles([]);
    setCaption('');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));
    setMediaFiles(prev => [...prev, ...newItems].slice(0, 10));
    e.target.value = '';
  };

  const removeMedia = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (mediaFiles.length === 0) return;
    setSaving(true);

    const user = await base44.auth.me();

    // Upload all media files to Firebase Storage
    const uploadedUrls = [];
    const uploadedTypes = [];
    for (const item of mediaFiles) {
      const storageRef = ref(storage, `capsule_media/${Date.now()}_${item.file.name}`);
      await uploadBytes(storageRef, item.file);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
      uploadedTypes.push(item.type);
    }

    // Fetch user profile for avatar/mood
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0] || {};

    await base44.entities.CapsuleContribution.create({
      capsule_id: capsuleId,
      contributor_name: user.full_name || 'Anonymous',
      contributor_avatar: profile.profile_picture_url,
      contributor_mood: profile.current_mood,
      body: caption.trim() || undefined,
      media_urls: uploadedUrls,
      media_types: uploadedTypes,
    });

    setSaving(false);
    reset();
    onAdded?.();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-end"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111111]">Add your memory</h2>
            <button onClick={handleClose} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />

          {mediaFiles.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-300 hover:border-gray-300 hover:text-gray-400 transition-colors mb-4"
            >
              <div className="flex gap-3">
                <ImagePlus className="w-7 h-7" />
                <Video className="w-7 h-7" />
              </div>
              <p className="text-xs font-medium">Tap to add photos or videos</p>
              <p className="text-[11px] text-gray-300">Required — text only posts are not allowed</p>
            </button>
          ) : (
            <div className="mb-4">
              {/* Preview strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaFiles.map((item, i) => (
                  <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                    {item.type === 'video' ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
                    )}
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300"
                >
                  <ImagePlus className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="relative mb-4">
            <Textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption… (optional)"
              className="bg-[#F5F5F5] border-0 rounded-xl text-sm text-[#111111] placeholder:text-gray-300 min-h-[70px] resize-none pr-12"
            />
            <div className="absolute bottom-2 right-2">
              <VoiceInput onTranscript={(text) => setCaption(prev => prev ? prev + ' ' + text : text)} />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={mediaFiles.length === 0 || saving}
            className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-11 text-sm font-medium disabled:opacity-40"
          >
            {saving ? 'Uploading…' : 'Share memory'}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}