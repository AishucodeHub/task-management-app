/*
# Create notifications and notification_preferences tables

1. New Tables
- `notifications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `type` (text, not null — e.g. 'task_assigned', 'due_date_approaching', 'status_changed', 'comment_added', 'reminder')
  - `title` (text, not null — short headline shown in the notification)
  - `body` (text, nullable — longer description)
  - `task_id` (uuid, nullable, references tasks(id) — the task this notification relates to)
  - `read_at` (timestamtz, nullable — null means unread; set when user marks as read)
  - `created_at` (timestamptz, default now())
  - `metadata` (jsonb, nullable — extra context like old/new status, actor, etc.)

- `notification_preferences`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, unique, defaults to authenticated user, references auth.users)
  - `in_app_enabled` (boolean, default true)
  - `push_enabled` (boolean, default false)
  - `email_enabled` (boolean, default false)
  - `email_summary_frequency` (text, default 'daily' — 'daily' or 'weekly' or 'off')
  - `dnd_start` (text, nullable — e.g. '22:00' — start of do-not-disturb window)
  - `dnd_end` (text, nullable — e.g. '08:00' — end of do-not-disturb window)
  - `reminder_lead_minutes` (integer, default 60 — minutes before due date to send reminder)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own notifications and preferences.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`.

3. Indexes
- Index on `notifications(user_id, created_at)` for fast per-user listing.
- Index on `notifications(user_id, read_at)` for fast unread-count queries.
- Index on `notification_preferences(user_id)` for quick preference lookups.

4. Important Notes
- `user_id` defaults to `auth.uid()` so inserts that omit `user_id` still satisfy RLS.
- `notification_preferences` has a unique constraint on `user_id` — one row per user.
- `notifications.read_at` is nullable: null = unread, non-null = read (with timestamp of read receipt).
- `notifications.metadata` is jsonb for flexible per-type context (old/new status, actor email, etc.).
- `notification_preferences.updated_at` trigger auto-updates on modification.
- The `tasks_status_changed` trigger function creates a notification row whenever a task's status changes,
  scoped to the task owner. It uses a SECURITY DEFINER function to bypass RLS for the insert.
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('task_assigned', 'due_date_approaching', 'status_changed', 'comment_added', 'reminder')),
  title text NOT NULL,
  body text,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT false,
  email_summary_frequency text NOT NULL DEFAULT 'daily' CHECK (email_summary_frequency IN ('daily', 'weekly', 'off')),
  dnd_start text,
  dnd_end text,
  reminder_lead_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notif_prefs" ON notification_preferences;
CREATE POLICY "select_own_notif_prefs" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notif_prefs" ON notification_preferences;
CREATE POLICY "insert_own_notif_prefs" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notif_prefs" ON notification_preferences;
CREATE POLICY "update_own_notif_prefs" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notif_prefs" ON notification_preferences;
CREATE POLICY "delete_own_notif_prefs" ON notification_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- Auto-update updated_at on notification_preferences
DROP TRIGGER IF EXISTS notif_prefs_updated_at ON notification_preferences;
CREATE TRIGGER notif_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SECURITY DEFINER function to create a notification when a task's status changes.
-- Runs as the task owner so the insert satisfies RLS without requiring the client to call.
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, type, title, body, task_id, metadata)
    VALUES (
      NEW.user_id,
      'status_changed',
      'Task status updated',
      '"' || NEW.title || '" moved to ' || NEW.status,
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tasks_status_changed_notification ON tasks;
CREATE TRIGGER tasks_status_changed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_status_change_notification();
