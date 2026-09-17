import { useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationType } from '@/lib/supabase';
import { X } from 'lucide-react';

const typeIcon: Record<NotificationType, string> = {
  task_assigned: '📋',
  due_date_approaching: '⏰',
  status_changed: '🔄',
  comment_added: '💬',
  reminder: '🔔',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  useEffect(() => {
    const timers = toasts.map((toast) => {
      return setTimeout(() => dismissToast(toast.toastId), 5000);
    });
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="card p-3.5 flex items-start gap-3 shadow-lg pointer-events-auto animate-slide-up"
        >
          <span className="text-xl shrink-0">{typeIcon[toast.type]}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-snug">{toast.title}</h4>
            {toast.body && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {toast.body}
              </p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.toastId)}
            className="p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
