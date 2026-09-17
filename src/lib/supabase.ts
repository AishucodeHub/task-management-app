import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  reminder_enabled: boolean;
  reminder_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'in_progress' | 'completed';
export type TaskFilter = 'all' | 'active' | 'completed' | 'high_priority';
export type ViewMode = 'list' | 'board';

export type NotificationType =
  | 'task_assigned'
  | 'due_date_approaching'
  | 'status_changed'
  | 'comment_added'
  | 'reminder';

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  task_id: string | null;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type NotificationPreferences = {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  email_summary_frequency: 'daily' | 'weekly' | 'off';
  dnd_start: string | null;
  dnd_end: string | null;
  reminder_lead_minutes: number;
  created_at: string;
  updated_at: string;
};
