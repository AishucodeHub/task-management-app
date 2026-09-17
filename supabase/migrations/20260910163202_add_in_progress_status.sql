/*
# Add 'in_progress' status to tasks table

1. Modified Tables
- `tasks`
  - `status` column CHECK constraint updated to allow 'in_progress' in addition to 'active' and 'completed'.
  - This enables a Kanban board layout with three columns: To Do (active), In Progress, and Completed.

2. Security
- No changes to RLS policies. Existing owner-scoped CRUD policies remain unchanged.

3. Important Notes
- The CHECK constraint is replaced (dropped + recreated) to include 'in_progress'.
- No data is lost — existing rows with 'active' or 'completed' remain valid under the new constraint.
- The 'active' status maps to the "To Do" column in the Kanban board.
*/

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('active', 'in_progress', 'completed'));
