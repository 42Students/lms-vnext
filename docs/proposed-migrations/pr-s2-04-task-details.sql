-- PR-S2-04 proposal only. DO NOT run until orchestrator reviews/registers migration.
-- Required before any code starts writing these columns; existing tasks remain compatible.
ALTER TABLE project_tasks
  ADD COLUMN blocker_reason text,
  ADD COLUMN due_date date,
  ADD COLUMN estimate_points integer,
  ADD COLUMN task_type varchar(16);
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_estimate_points_ck
  CHECK (estimate_points IS NULL OR (estimate_points >= 0 AND estimate_points <= 1000));
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_task_type_ck
  CHECK (task_type IS NULL OR task_type IN ('STORY','BUG','CHORE','SPIKE'));
-- Cross-table comment task ownership needs this composite reference (task id stays globally unique).
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_project_id_id_uq UNIQUE (project_id,id);
CREATE TABLE project_task_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
 task_id uuid NOT NULL,
 author_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT project_task_comments_project_task_fk FOREIGN KEY(project_id,task_id)
 REFERENCES project_tasks(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_task_comments_task_time_idx ON project_task_comments(task_id,created_at);
-- Follow-up after schema promotion: scoped author eligibility, append-only history,
-- status blocker validation, task edit forms and tenant/authorization regression.
