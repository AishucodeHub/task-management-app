import { useCallback, useEffect, useState } from 'react';
import { supabase, type Task, type TaskFilter, type TaskPriority, type TaskStatus, type ViewMode } from '@/lib/supabase';
import Header from '@/components/Header';
import TaskItem from '@/components/TaskItem';
import TaskFormModal from '@/components/TaskFormModal';
import EmptyState from '@/components/EmptyState';
import KanbanBoard from '@/components/KanbanBoard';
import { Loader2, AlertCircle } from 'lucide-react';

type TaskFormData = {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  reminder_enabled: boolean;
  reminder_at: string;
};

const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to load tasks. Please try again.');
    } else {
      setTasks((data as Task[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const handleSave = async (data: TaskFormData) => {
    const reminderChanged = editingTask
      ? (editingTask.reminder_enabled !== data.reminder_enabled ||
         (editingTask.reminder_at ?? '') !== (data.reminder_at || null))
      : false;

    const payload = {
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      priority: data.priority,
      reminder_enabled: data.reminder_enabled,
      reminder_at: data.reminder_at || null,
      reminder_sent: reminderChanged ? false : editingTask?.reminder_sent ?? false,
    };

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
      if (error) {
        setError('Failed to update task.');
        return;
      }
    } else {
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) {
        setError('Failed to create task.');
        return;
      }
    }

    setModalOpen(false);
    setEditingTask(null);
    await fetchTasks();
  };

  const handleToggle = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'active' : 'completed';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);
    if (error) {
      setError('Failed to update task status.');
      fetchTasks();
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);
    if (error) {
      setError('Failed to update task status.');
      fetchTasks();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      setError('Failed to delete task.');
      fetchTasks();
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const searchFiltered = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredTasks = searchFiltered
    .filter((t) => {
      if (filter === 'high_priority') return t.priority === 'high';
      if (filter === 'all') return true;
      return t.status === filter;
    })
    .sort((a, b) => {
      const statusOrder: Record<TaskStatus, number> = { active: 0, in_progress: 1, completed: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const counts = {
    all: tasks.length,
    active: tasks.filter((t) => t.status === 'active').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    high_priority: tasks.filter((t) => t.priority === 'high').length,
  };

  return (
    <div className="min-h-screen">
      <Header
        filter={filter}
        onFilterChange={setFilter}
        onNewTask={handleNewTask}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4 animate-scale-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {viewMode === 'board' ? (
          <KanbanBoard
            tasks={searchFiltered}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState filter={filter} hasSearch={searchQuery.trim() !== ''} />
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <TaskFormModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
