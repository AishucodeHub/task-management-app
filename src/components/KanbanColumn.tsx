import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '@/lib/supabase';
import KanbanCard from '@/components/KanbanCard';

type Props = {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  accentColor: string;
  dotColor: string;
};

export default function KanbanColumn({ id, title, tasks, onEdit, onDelete, accentColor, dotColor }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[280px] w-full flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border-2 border-dashed p-3 space-y-2.5 min-h-[200px] transition-colors duration-200 ${
          isOver
            ? `${accentColor} border-solid`
            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-600">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
