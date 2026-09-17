import { CheckSquare } from 'lucide-react';
import type { TaskFilter } from '@/lib/supabase';

type Props = {
  filter: TaskFilter;
  hasSearch?: boolean;
};

const messages: Record<TaskFilter, { title: string; subtitle: string }> = {
  all: {
    title: 'No tasks yet',
    subtitle: 'Create your first task to get started.',
  },
  active: {
    title: 'No active tasks',
    subtitle: 'All caught up! Tasks you create will appear here.',
  },
  completed: {
    title: 'No completed tasks',
    subtitle: 'Finished tasks will show up here.',
  },
  high_priority: {
    title: 'No high priority tasks',
    subtitle: 'Tasks marked as high priority will appear here.',
  },
};

export default function EmptyState({ filter, hasSearch }: Props) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mb-4">
          <CheckSquare className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No matching tasks</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try a different search term.</p>
      </div>
    );
  }

  const msg = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mb-4">
        <CheckSquare className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">{msg.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{msg.subtitle}</p>
    </div>
  );
}
