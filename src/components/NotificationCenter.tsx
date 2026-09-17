import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import type { Notification, NotificationType } from '@/lib/supabase';
import { X, CheckCheck, Trash2, Bell, Search } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const typeConfig: Record<NotificationType, { icon: string; color: string }> = {
  task_assigned: { icon: '📋', color: 'text-blue-600 dark:text-blue-400' },
  due_date_approaching: { icon: '⏰', color: 'text-amber-600 dark:text-amber-400' },
  status_changed: { icon: '🔄', color: 'text-purple-600 dark:text-purple-400' },
  comment_added: { icon: '💬', color: 'text-gray-600 dark:text-gray-400' },
  reminder: { icon: '🔔', color: 'text-red-600 dark:text-red-400' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationCenter({ open, onClose }: Props) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = notifications
    .filter((n) => (filter === 'unread' ? n.read_at === null : true))
    .filter((n) =>
      search.trim()
        ? n.title.toLowerCase().includes(search.toLowerCase().trim()) ||
          (n.body?.toLowerCase().includes(search.toLowerCase().trim()) ?? false)
        : true
    );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in-right"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-900">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Unread
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search.trim() ? 'No matching notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-900">
              {filtered.map((notif: Notification) => {
                const config = typeConfig[notif.type];
                const isUnread = notif.read_at === null;
                return (
                  <div
                    key={notif.id}
                    className={`group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer ${
                      isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => {
                      if (isUnread) markAsRead(notif.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-sm leading-snug ${isUnread ? 'font-semibold' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                            {notif.title}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {timeAgo(notif.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
