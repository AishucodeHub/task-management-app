import { useState, type FormEvent } from 'react';
import type { Task, TaskPriority } from '@/lib/supabase';
import { X, Calendar, Flag, Bell, Clock } from 'lucide-react';

type TaskFormData = {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  reminder_enabled: boolean;
  reminder_at: string;
};

type Props = {
  task: Task | null;
  onSave: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
};

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600 dark:text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-red-600 dark:text-red-400' },
];

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

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskFormModal({ task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminder_enabled ?? false);
  const [reminderMode, setReminderMode] = useState<'lead' | 'custom'>(
    task?.reminder_at && !dueDate ? 'custom' : 'lead'
  );
  const [reminderLead, setReminderLead] = useState(60);
  const [reminderAt, setReminderAt] = useState(
    task?.reminder_at ? toLocalDatetimeInput(new Date(task.reminder_at)) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = task !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    let finalReminderAt: string | null = null;
    if (reminderEnabled) {
      if (reminderMode === 'custom' && reminderAt) {
        finalReminderAt = new Date(reminderAt).toISOString();
      } else if (reminderMode === 'lead' && dueDate) {
        const due = new Date(dueDate + 'T00:00:00');
        due.setMinutes(due.getMinutes() - reminderLead);
        finalReminderAt = due.toISOString();
      }
    }

    setSaving(true);
    setError(null);
    await onSave({
      title: title.trim(),
      description,
      due_date: dueDate,
      priority,
      reminder_enabled: reminderEnabled,
      reminder_at: finalReminderAt ?? '',
    });
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-6 animate-scale-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit task' : 'New task'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Due date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="input pl-10 appearance-none cursor-pointer"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reminder section */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-gray-400" />
                  Reminder
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Get notified before this task is due
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  reminderEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    reminderEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {reminderEnabled && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => setReminderMode('lead')}
                    disabled={!dueDate}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      reminderMode === 'lead'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    } ${!dueDate ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderMode('custom')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      reminderMode === 'custom'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Custom date & time
                  </button>
                </div>

                {reminderMode === 'lead' ? (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={reminderLead}
                      onChange={(e) => setReminderLead(Number(e.target.value))}
                      className="input pl-10 appearance-none cursor-pointer"
                    >
                      {leadOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={reminderAt}
                      onChange={(e) => setReminderAt(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
