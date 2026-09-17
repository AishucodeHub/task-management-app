import type { TaskPriority } from '@/lib/supabase';

export const priorityConfig: Record<TaskPriority, { label: string; classes: string; dot: string; border: string }> = {
  high: {
    label: 'High',
    classes: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    border: 'border-l-yellow-500',
  },
  low: {
    label: 'Low',
    classes: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    dot: 'bg-green-500',
    border: 'border-l-green-500',
  },
};

export function formatDueDate(dateStr: string | null): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: '', isOverdue: false };
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = diff < 0;
  let text: string;
  if (diff === 0) text = 'Today';
  else if (diff === 1) text = 'Tomorrow';
  else if (diff === -1) text = 'Yesterday';
  else if (diff > 0 && diff <= 7) text = `In ${diff} days`;
  else text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return { text, isOverdue };
}
