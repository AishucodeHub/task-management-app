import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase, type Notification, type NotificationPreferences } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ToastNotification = Notification & { toastId: string };

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  toasts: ToastNotification[];
  preferences: NotificationPreferences | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  dismissToast: (toastId: string) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const REMINDER_POLL_INTERVAL = 60_000;

function isWithinDndWindow(dndStart: string | null, dndEnd: string | null): boolean {
  if (!dndStart || !dndEnd) return false;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const nowStr = `${hh}:${mm}`;
  if (dndStart < dndEnd) {
    return nowStr >= dndStart && nowStr < dndEnd;
  }
  return nowStr >= dndStart || nowStr < dndEnd;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return;
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, []);

  const fetchPreferences = useCallback(async () => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .maybeSingle();

    if (error) return;
    if (data) {
      setPreferences(data as NotificationPreferences);
    } else {
      const { data: created } = await supabase
        .from('notification_preferences')
        .insert({})
        .select('*')
        .maybeSingle();
      if (created) setPreferences(created as NotificationPreferences);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(prefs)
      .eq('user_id', user?.id ?? '')
      .select('*')
      .maybeSingle();
    if (error) return;
    if (data) setPreferences(data as NotificationPreferences);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setToasts([]);
      setPreferences(null);
      knownIds.current.clear();
      setLoading(false);
      return;
    }
    knownIds.current.clear();
    fetchNotifications();
    fetchPreferences();
  }, [user, fetchNotifications, fetchPreferences]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.user_id !== user.id) return;
          if (knownIds.current.has(newNotif.id)) return;
          knownIds.current.add(newNotif.id);

          setNotifications((prev) => [newNotif, ...prev]);

          const toastId = `${newNotif.id}-${Date.now()}`;
          setToasts((prev) => [...prev, { ...newNotif, toastId }]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        (payload) => {
          const deleted = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Reminder checker: polls tasks with reminders due, creates notifications
  useEffect(() => {
    if (!user || !preferences) return;
    if (!preferences.in_app_enabled) return;

    let cancelled = false;

    const checkReminders = async () => {
      if (cancelled) return;
      if (isWithinDndWindow(preferences.dnd_start, preferences.dnd_end)) return;

      const now = new Date().toISOString();

      const { data: dueTasks } = await supabase
        .from('tasks')
        .select('id, title, due_date, reminder_enabled, reminder_at, reminder_sent')
        .eq('reminder_enabled', true)
        .eq('reminder_sent', false)
        .not('reminder_at', 'is', null)
        .lte('reminder_at', now)
        .neq('status', 'completed');

      if (cancelled) return;
      if (!dueTasks || dueTasks.length === 0) return;

      for (const task of dueTasks) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'due_date_approaching',
          title: 'Reminder: ' + task.title,
          body: task.due_date
            ? `Due on ${new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Task deadline is approaching',
          task_id: task.id,
          metadata: { reminder_at: task.reminder_at },
        });
        if (notifError) continue;

        await supabase
          .from('tasks')
          .update({ reminder_sent: true })
          .eq('id', task.id);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, REMINDER_POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, preferences]);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    if (error) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    if (error) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        toasts,
        preferences,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        dismissToast,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
