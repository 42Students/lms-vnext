-- [chat-14] G2-13-017-013: preserve typed legacy assignee source identity
-- without treating a numeric source ID as a college membership or actor grant.
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS legacy_assignee_id integer;
CREATE INDEX IF NOT EXISTS project_tasks_legacy_assignee_lookup_idx
  ON project_tasks (project_id, legacy_assignee_type, legacy_assignee_id)
  WHERE legacy_assignee_id IS NOT NULL;
