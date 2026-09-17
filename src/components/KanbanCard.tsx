import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/lib/supabase';
import { priorityConfig, formatDueDate } from '@/lib/task-utils';
import { Calendar, Pencil, Trash2, GripVertical } from 'lucide-react';

type Props = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isOverlay?: boolean;
};

export default function KanbanCard({ task, onEdit, onDelete, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityConfig[task.priority];
  const due = formatDueDate(task.due_date);
  const isCompleted = task.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group card border-l-4 ${priority.border} p-3 cursor-grab active:cursor-grabbing transition-shadow ${
        isOverlay ? 'shadow-lg rotate-2' : 'hover:shadow-md'
      } ${isDragging && !isOverlay ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-medium text-sm leading-snug ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}
        >
          {task.title}
        </h3>
        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5 group-hover:text-gray-400 transition-colors" />
      </div>

      {task.description && (
        <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 ${isCompleted ? 'line-through' : ''}`}>
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${priority.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>

        {due.text && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              due.isOverdue && !isCompleted ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {due.text}
            {due.isOverdue && !isCompleted && ' · Overdue'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          aria-label="Edit task"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          aria-label="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
