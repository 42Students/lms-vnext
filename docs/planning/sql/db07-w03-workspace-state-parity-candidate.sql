-- W03 DB07 DRAFT ONLY — NOT registered in the Drizzle journal.
-- W01 owns migration numbering/schema snapshot/replay.
--
-- Legacy project_workspace has user-visible state that is not equivalent to
-- vNext's existing status/archived_at. This draft deliberately keeps Archive
-- separate from recoverable Delete/Restore.

ALTER TABLE project_instances
  ADD COLUMN section_id uuid,
  ADD COLUMN phase varchar(80),
  ADD COLUMN blocker text,
  ADD COLUMN next_action text,
  ADD COLUMN due_label varchar(80),
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  ADD COLUMN sprint_length_weeks integer NOT NULL DEFAULT 4,
  ADD COLUMN estimation_unit varchar(20) NOT NULL DEFAULT 'POINTS',
  ADD COLUMN version bigint NOT NULL DEFAULT 0,
  ADD COLUMN readiness_override boolean,
  ADD COLUMN readiness_override_note text,
  ADD COLUMN readiness_override_by_user_id uuid,
  ADD COLUMN readiness_override_at timestamptz,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by_user_id uuid,
  ADD COLUMN recoverable_content boolean NOT NULL DEFAULT false;

ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_section_fk
  FOREIGN KEY (section_id)
  REFERENCES sections(id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT project_instances_dates_ck
  CHECK (
    start_date IS NULL
    OR end_date IS NULL
    OR end_date >= start_date
  ),
  ADD CONSTRAINT project_instances_sprint_length_ck
  CHECK (sprint_length_weeks BETWEEN 1 AND 52),
  ADD CONSTRAINT project_instances_estimation_unit_ck
  CHECK (estimation_unit IN ('POINTS','HOURS')),
  ADD CONSTRAINT project_instances_version_ck
  CHECK (version >= 0),
  ADD CONSTRAINT project_instances_readiness_override_shape_ck
  CHECK (
    (
      readiness_override IS DISTINCT FROM TRUE
      AND readiness_override_note IS NULL
      AND readiness_override_by_user_id IS NULL
      AND readiness_override_at IS NULL
    )
    OR
    (
      readiness_override = TRUE
      AND readiness_override_note IS NOT NULL
      AND length(trim(readiness_override_note)) > 0
      AND readiness_override_by_user_id IS NOT NULL
      AND readiness_override_at IS NOT NULL
    )
  ),
  ADD CONSTRAINT project_instances_readiness_override_user_fk
  FOREIGN KEY (readiness_override_by_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT project_instances_deleted_shape_ck
  CHECK (
    (deleted_at IS NULL AND deleted_by_user_id IS NULL)
    OR
    (deleted_at IS NOT NULL AND deleted_by_user_id IS NOT NULL)
  ),
  ADD CONSTRAINT project_instances_deleted_by_user_fk
  FOREIGN KEY (deleted_by_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  project_instances_college_deleted_idx
  ON project_instances(college_id, deleted_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS
  project_instances_college_blocker_idx
  ON project_instances(college_id, updated_at DESC)
  WHERE blocker IS NOT NULL AND deleted_at IS NULL;

-- High-confidence normalized mappings:
-- project_workspace.class_id                -> section_id (vNext section)
-- project_workspace.phase                   -> phase
-- project_workspace.blocker                 -> blocker
-- project_workspace.next_action             -> next_action
-- project_workspace.due_label               -> due_label
-- project_workspace.start_date/end_date     -> start_date/end_date
-- project_workspace.sprint_length_weeks     -> sprint_length_weeks
-- project_workspace.estimation_unit         -> estimation_unit
-- project_workspace.version                 -> version
-- readiness_override(_note/_by/_at)         -> canonical override fields
-- is_deleted                                -> deleted_at IS NOT NULL
-- recoverable_content                       -> recoverable_content
--
-- Existing normalized/derived mappings that SHOULD NOT create duplicate
-- storage during promotion:
-- organization_id -> project_instances.college_id -> colleges.organization_id
-- progress        -> derived from tasks/sprints/releases (admin insights)
-- overview        -> project summary + pinned template version
-- sprints/tasks/resources/meetings/delivery -> normalized child tables
-- activity        -> activity_events + staged immutable DB07 history
-- template_snapshot -> pinned project_template_versions row
-- team_group_id   -> project_instances.team_group_id (already live)
--
-- OPEN cross-lane dispositions (do not invent columns here):
-- section_id tenant consistency: service must validate section.collegeId equals
-- project college; W01 should decide whether to enforce the cross-table tenant
-- invariant with a canonical academic composite key/trigger.
-- course_label: verify whether still user-visible or historical snapshot only.
-- bulk_learner_id: verify creation provenance/consumer before retaining.
-- created_by: already normalized to created_by_user_id; updated_by is not yet
--             persisted on project_instances and needs actor-attribution review.
--
-- Delete/restore state machine after migration:
-- DELETE: set deleted_at/deleted_by_user_id in one locked transaction, emit
--         PROJECTS_PROJECT_DELETED. Do not overload status='ARCHIVED'.
-- RESTORE: clear deleted_at/deleted_by_user_id, emit PROJECTS_PROJECT_RESTORED.
-- Active list/read access must exclude deleted rows except explicit Deleted
-- Workspaces admin surfaces. Restore requires projects.manage in same college.
-- Permanent purge remains out of scope until retention policy is explicit.
--
-- W01 promotion gate:
-- 1. canonical Drizzle fields + migration + snapshot;
-- 2. zero-to-head replay on disposable Postgres;
-- 3. direct invalid readiness/delete/date shapes fail with 23514;
-- 4. W03 implements delete/restore/readiness mutation services only after live;
-- 5. deleted rows are inaccessible to Learner/Mentor and normal admin lists;
-- 6. exact legacy Deleted Workspaces browser flow remains OPEN until tested.
