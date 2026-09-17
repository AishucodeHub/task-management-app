/*
# Add reminder columns to tasks table

1. Changes to existing tables
- `tasks`
  - `reminder_enabled` (boolean, default false) — whether a reminder notification should fire for this task
  - `reminder_at` (timestamptz, nullable) — the specific date & time when the reminder should fire (customizable per task)
  - `reminder_sent` (boolean, default false) — tracks whether the reminder has already been sent (prevents duplicates)

2. Security
- No new tables. Existing RLS policies on `tasks` already cover the new columns (UPDATE/INSERT policies use auth.uid() = user_id which applies to all columns).

3. Important Notes
- `reminder_at` is a full timestamp (date + time), not just a date, so users can pick an exact time like "Sep 15 at 2:30 PM".
- `reminder_sent` is set to true by the client after the reminder notification is created, so the same task doesn't trigger repeatedly.
- When a task's `reminder_enabled` is toggled on or `reminder_at` is changed, `reminder_sent` resets to false so the new reminder can fire.
*/

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
