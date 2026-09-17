import type { Task } from '@/lib/supabase';
import { priorityConfig, formatDueDate } from '@/lib/task-utils';
import { Check, Trash2, Pencil, Calendar } from 'lucide-react';

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const isCompleted = task.status === 'completed';
  const priority = priorityConfig[task.priority];
  const due = formatDueDate(task.due_date);

  return (
    <div className="group card p-4 hover:shadow-md transition-all duration-200 animate-slide-up">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
          }`}
          aria-label={isCompleted ? 'Mark as active' : 'Mark as completed'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium text-sm leading-snug ${
                isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
              }`}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                aria-label="Edit task"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 ${
                isCompleted ? 'line-through' : ''
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${priority.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>

            {due.text && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  due.isOverdue && !isCompleted
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {due.text}
                {due.isOverdue && !isCompleted && ' · Overdue'}
              </span>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Check className="w-3.5 h-3.5" />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
