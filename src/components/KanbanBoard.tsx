import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Task, TaskStatus } from '@/lib/supabase';
import KanbanColumn from '@/components/KanbanColumn';
import KanbanCard from '@/components/KanbanCard';
import { Loader2 } from 'lucide-react';

type Props = {
  tasks: Task[];
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  loading: boolean;
};

const columns: { id: TaskStatus; title: string; accentColor: string; dotColor: string }[] = [
  { id: 'active', title: 'To Do', accentColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600', dotColor: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', accentColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600', dotColor: 'bg-amber-500' },
  { id: 'completed', title: 'Completed', accentColor: 'bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600', dotColor: 'bg-green-500' },
];

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete, loading }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const overId = over.id as string;
    const targetColumn = columns.find((c) => c.id === overId);

    if (targetColumn) {
      const task = tasks.find((t) => t.id === active.id);
      if (task && task.status !== targetColumn.id) {
        onStatusChange(task, targetColumn.id);
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      const task = tasks.find((t) => t.id === active.id);
      if (task && task.status !== overTask.status) {
        onStatusChange(task, overTask.status);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasks.filter((t) => t.status === col.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            accentColor={col.accentColor}
            dotColor={col.dotColor}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <KanbanCard task={activeTask} onEdit={onEdit} onDelete={onDelete} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
