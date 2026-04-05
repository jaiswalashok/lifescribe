'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Bell, Users, MessageCircle, Archive, Check, CheckCheck, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const TYPE_META = {
  circle_invite:        { icon: Users,         color: 'bg-blue-100 text-blue-600',    label: 'Circle Invite' },
  circle_accepted:      { icon: Users,         color: 'bg-green-100 text-green-600',  label: 'Invite Accepted' },
  capsule_invite:       { icon: Archive,       color: 'bg-purple-100 text-purple-600', label: 'Capsule Invite' },
  trustee_designated:   { icon: Shield,        color: 'bg-indigo-100 text-indigo-600', label: 'Trustee' },
  message:              { icon: MessageCircle, color: 'bg-yellow-100 text-yellow-600', label: 'Message' },
  default:              { icon: Bell,          color: 'bg-gray-100 text-gray-500',    label: 'Notification' },
};

function NotifIcon({ type }) {
  const meta = TYPE_META[type] || TYPE_META.default;
  const Icon = meta.icon;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [markingAll, setMarkingAll] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
  });

  const unread = notifications.filter(n => !n.is_read);

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.Notification.update(n.id, { is_read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setMarkingAll(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-[#111111]">Notifications</h1>
            {unread.length > 0 && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                {unread.length}
              </span>
            )}
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#111111] transition-colors font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {markingAll ? 'Clearing…' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#111111] rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300 mt-1">Circle invites and updates will appear here</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="space-y-1">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50/60'}`}
              >
                <NotifIcon type={n.notification_type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-600' : 'text-[#111111] font-medium'}`}>
                    {n.title || n.message}
                  </p>
                  {n.message && n.title && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[10px] text-gray-300 mt-1">
                    {n.created_date
                      ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true })
                      : ''}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
