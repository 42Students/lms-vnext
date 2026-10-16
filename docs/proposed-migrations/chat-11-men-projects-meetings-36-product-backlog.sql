-- MEN-projects-meetings-36 / MEN-projects-meetings-39
-- Proposal only: orchestrator must register as a numbered migration.
-- Backlog tasks have sprint_id = NULL. Existing task IDs and audit/history stay intact.
ALTER TABLE project_tasks ALTER COLUMN sprint_id DROP NOT NULL;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS carried_from_sprint_id uuid
  REFERENCES project_sprints(id) ON DELETE RESTRICT;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS carried_over_at timestamptz;
CREATE INDEX IF NOT EXISTS project_tasks_backlog_project_idx
 ON project_tasks(project_id,sequence) WHERE sprint_id IS NULL;
-- Existing UNIQUE(sprint_id, sequence) excludes NULL sprint IDs by design.
-- Use serializable project locks to assign new monotonic backlog sequence values.
-- Publish PROJECT_BACKLOG_SCHEMA_READY=true only after migration has been registered and applied.
