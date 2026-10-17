-- MEN-projects-meetings-53 / -55 / -57: proposed only, orchestrator registers
-- after cross-checking the existing project_resources journal and replaying
-- against disposable PostgreSQL. Never apply this draft to production directly.
ALTER TABLE project_resources
  ADD COLUMN IF NOT EXISTS resource_type varchar(24) NOT NULL DEFAULT 'LINK',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_notes text,
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES project_sprints(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES project_tasks(id) ON DELETE RESTRICT;

ALTER TABLE project_resources DROP CONSTRAINT IF EXISTS project_resources_status_ck;
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_status_ck
  CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED'));

ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_type_ck
  CHECK (resource_type IN ('FILE', 'LINK', 'DOCUMENT', 'CODE', 'NOTE', 'ENVIRONMENT'));
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_access_notes_ck
  CHECK (access_notes IS NULL OR length(access_notes) <= 4000);

CREATE INDEX IF NOT EXISTS project_resources_sprint_idx ON project_resources(project_id, sprint_id);
CREATE INDEX IF NOT EXISTS project_resources_task_idx ON project_resources(project_id, task_id);

-- Database-enforced project-scope associations: resources must never point to
-- another project's sprint or task, including concurrent direct SQL mutations.
-- The relevant parent composite unique keys are created once in the
-- authoritative migration registered by the orchestrator.
CREATE UNIQUE INDEX IF NOT EXISTS project_sprints_id_project_uq ON project_sprints(id, project_id);
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_id_project_uq ON project_tasks(id, project_id);
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_sprint_project_fk FOREIGN KEY(sprint_id,project_id)
  REFERENCES project_sprints(id,project_id) ON DELETE RESTRICT;
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_task_project_fk FOREIGN KEY(task_id,project_id)
  REFERENCES project_tasks(id,project_id) ON DELETE RESTRICT;

-- Historical text-only rows remain valid; review the reclassification of
-- existing description-only resources separately (default LINK is safe and reversible).
