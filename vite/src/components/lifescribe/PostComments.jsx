import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MoodRingAvatar from './MoodRingAvatar';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

export default function PostComments({ postId, currentUserName, currentUserMood }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }),
  });

  const addComment = useMutation({
    mutationFn: (body) => base44.entities.Comment.create({
      post_id: postId,
      post_type: 'journal_entry',
      commenter_name: currentUserName || 'You',
      commenter_mood: currentUserMood,
      body,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setText('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment.mutate(text.trim());
  };

  return (
    <div className="border-t border-gray-100 px-4 pt-3 pb-2">
      {comments.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <MoodRingAvatar size={24} mood={c.commenter_mood} name={c.commenter_name} />
              <div className="flex-1 bg-[#F5F5F5] rounded-xl px-3 py-2">
                <span className="text-xs font-semibold text-[#111111] mr-1.5">{c.commenter_name}</span>
                <span className="text-xs text-gray-600">{c.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <MoodRingAvatar size={28} mood={currentUserMood} name={currentUserName || 'You'} />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-[#F5F5F5] rounded-full px-3 py-1.5 text-xs text-[#111111] border-0 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="text-[#111111] disabled:text-gray-300 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}