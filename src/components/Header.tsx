import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { CheckSquare, Sun, Moon, LogOut, Plus, Search, X, List, Columns3, Bell, Settings } from 'lucide-react';
import type { TaskFilter, ViewMode } from '@/lib/supabase';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationSettings from '@/components/NotificationSettings';

type Props = {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onNewTask: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: { all: number; active: number; completed: number; high_priority: number };
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const filterOptions: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'high_priority', label: 'High Priority' },
];

export default function Header({ filter, onFilterChange, onNewTask, searchQuery, onSearchChange, counts, viewMode, onViewModeChange }: Props) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-sm">
              <CheckSquare className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">TaskFlow</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950 animate-scale-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notification settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-x-auto">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  filter === opt.value
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {opt.label}
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {counts[opt.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('board')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                aria-label="Board view"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>

            <button onClick={onNewTask} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New task</span>
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title..."
            className="input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      <NotificationSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
