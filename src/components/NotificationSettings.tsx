import { useState, useEffect, type FormEvent } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationPreferences } from '@/lib/supabase';
import { X, Bell, Clock, Moon, Save } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationSettings({ open, onClose }: Props) {
  const { preferences, updatePreferences } = useNotifications();
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [reminderLead, setReminderLead] = useState(60);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    setInAppEnabled(preferences.in_app_enabled);
    setReminderLead(preferences.reminder_lead_minutes);
    setDndEnabled(!!preferences.dnd_start && !!preferences.dnd_end);
    setDndStart(preferences.dnd_start ?? '22:00');
    setDndEnd(preferences.dnd_end ?? '08:00');
  }, [preferences]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const prefs: Partial<NotificationPreferences> = {
      in_app_enabled: inAppEnabled,
      reminder_lead_minutes: reminderLead,
      dnd_start: dndEnabled ? dndStart : null,
      dnd_end: dndEnabled ? dndEnd : null,
    };
    await updatePreferences(prefs);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const leadOptions = [
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 240, label: '4 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' },
    { value: 10080, label: '1 week before' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* In-app toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-gray-400" />
                In-app notifications
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Show toast popups and badge counts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInAppEnabled(!inAppEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                inAppEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  inAppEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Default reminder lead time */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Default reminder time
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              When creating a task with a due date, the reminder will fire this far in advance by default. You can customize the exact reminder time per task.
            </p>
            <select
              value={reminderLead}
              onChange={(e) => setReminderLead(Number(e.target.value))}
              className="input"
              disabled={!inAppEnabled}
            >
              {leadOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Do Not Disturb */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-gray-400" />
                  Do Not Disturb
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pause reminders during these hours
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDndEnabled(!dndEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  dndEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
                disabled={!inAppEnabled}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    dndEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            {dndEnabled && (
              <div className="flex items-center gap-3 mt-2 animate-fade-in">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                  <input
                    type="time"
                    value={dndStart}
                    onChange={(e) => setDndStart(e.target.value)}
                    className="input"
                  />
                </div>
                <span className="text-gray-400 mt-5">to</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Until</label>
                  <input
                    type="time"
                    value={dndEnd}
                    onChange={(e) => setDndEnd(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : saved ? 'Saved!' : (
                <>
                  <Save className="w-4 h-4" />
                  Save settings
                </>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
