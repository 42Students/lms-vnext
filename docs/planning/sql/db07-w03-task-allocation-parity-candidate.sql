-- W03 DB07 DRAFT ONLY — NOT registered in the Drizzle journal.
-- W01 owns migration numbering, schema barrel, snapshot and replay.
--
-- Normalized parity for legacy project_task fields used by Board / Task
-- Allocation. This does NOT copy legacy assignee_id + assignee_type + name;
-- vNext assigns to the canonical project_members row so tenant/project
-- membership and historical attribution remain explicit.

-- project_members.id is globally unique, but this composite target makes the
-- same-project assignee invariant enforceable by PostgreSQL.
CREATE UNIQUE INDEX IF NOT EXISTS
  project_members_project_id_id_uq
  ON project_members(project_id, id);

ALTER TABLE project_tasks
  ADD COLUMN assignee_project_member_id uuid,
  ADD COLUMN due_date date,
  ADD COLUMN due_label varchar(80),
  ADD COLUMN estimate_points integer,
  ADD COLUMN task_type varchar(20) NOT NULL DEFAULT 'STORY',
  ADD COLUMN approach text,
  ADD COLUMN blocker_reason text,
  ADD COLUMN removed_from_template boolean NOT NULL DEFAULT false,
  ADD COLUMN version bigint NOT NULL DEFAULT 0,
  ADD COLUMN created_by_user_id uuid,
  ADD COLUMN updated_by_user_id uuid;

ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_assignee_same_project_fk
  FOREIGN KEY (project_id, assignee_project_member_id)
  REFERENCES project_members(project_id, id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT project_tasks_created_by_user_fk
  FOREIGN KEY (created_by_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT project_tasks_updated_by_user_fk
  FOREIGN KEY (updated_by_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT project_tasks_estimate_points_ck
  CHECK (estimate_points IS NULL OR estimate_points >= 0),
  ADD CONSTRAINT project_tasks_task_type_ck
  CHECK (task_type IN ('STORY','BUG','CHORE','SPIKE')),
  ADD CONSTRAINT project_tasks_blocker_shape_ck
  CHECK (
    status <> 'BLOCKED'
    OR (
      blocker_reason IS NOT NULL
      AND length(trim(blocker_reason)) > 0
    )
  ),
  ADD CONSTRAINT project_tasks_version_ck
  CHECK (version >= 0);

CREATE INDEX IF NOT EXISTS
  project_tasks_assignee_status_idx
  ON project_tasks(project_id, assignee_project_member_id, status);

CREATE INDEX IF NOT EXISTS
  project_tasks_due_date_idx
  ON project_tasks(project_id, due_date)
  WHERE due_date IS NOT NULL;

-- Carry-over storage/FK ownership belongs to
-- db07-w03-task-backlog-and-delivery-state-candidate.sql because that draft
-- also makes sprint_id nullable for the legacy backlog transition. Do not add
-- carried_over_from_sprint_id a second time from this allocation draft.

-- Intended semantic mappings from legacy project_task:
-- task_key                 -> project_tasks.template_key
-- sprint_key/sprint_label  -> project_tasks.sprint_id -> project_sprints
-- sort_order               -> project_tasks.sequence
-- assignee_id/type/name    -> assignee_project_member_id -> canonical member
-- due_date/due_label       -> due_date/due_label
-- estimate_points          -> estimate_points
-- task_type                -> task_type
-- approach                 -> approach
-- blocker_reason           -> blocker_reason
-- carried_over...sprint_key -> carried_over_from_sprint_id
-- deleted_by_workspace     -> removed_from_template
-- version                  -> version (optimistic edit token)
-- created_by/updated_by    -> canonical created_by_user_id/updated_by_user_id
-- submission_url/submitted_by/submitted_at
--                          -> project_task_submissions (already normalized)
-- is_deleted               -> NOT mapped to removed_from_template; true task
--                            deletion/restore needs a separate disposition.
--
-- W01 promotion requirements:
-- * canonical Drizzle fields and migration/snapshot generated together;
-- * existing rows get safe task_type/version defaults;
-- * direct SQL cross-project assignee/carry-over writes fail with 23503;
-- * BLOCKED without blocker_reason fails with 23514;
-- * W03 must wire task edit/allocation APIs only after the migration is live;
-- * browser Task Allocation remains PARTIAL until those APIs and tests pass.
