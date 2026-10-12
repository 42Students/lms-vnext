-- DB-073 / Chat 2 — DRAFT ONLY; NOT A REGISTERED MIGRATION.
-- Chat 1 owns drizzle/**, src/db/schema/index.ts, and migration integration.
-- Frozen vNext source: src/db/schema/projects.ts on main, 2026-10-12.
--
-- Project release, sprint, task and task-submission rows each have valid
-- independent FKs, but cross-project parent-child combinations remain possible.
-- The existing service's checks cannot substitute for DB referential integrity
-- against direct SQL or competing concurrent transactions.
-- No source/legacy production data migration is required in greenfield vNext.
--
-- PREFLIGHT: both the SELECT inspection and DO reject guard are required.
SELECT s.id, s.project_id AS sprint_project_id,
       r.project_id AS release_project_id
  FROM project_sprints s
  JOIN project_releases r ON r.id = s.release_id
 WHERE s.project_id <> r.project_id;

SELECT t.id, t.project_id AS task_project_id,
       s.project_id AS sprint_project_id
  FROM project_tasks t
  JOIN project_sprints s ON s.id = t.sprint_id
 WHERE t.project_id <> s.project_id;

SELECT sub.id, sub.project_id AS submission_project_id,
       t.project_id AS task_project_id
  FROM project_task_submissions sub
  JOIN project_tasks t ON t.id = sub.task_id
 WHERE sub.project_id <> t.project_id;

DO $db073_project_lineage_preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM project_sprints s
    JOIN project_releases r ON r.id = s.release_id
    WHERE s.project_id <> r.project_id
  ) OR EXISTS (
    SELECT 1 FROM project_tasks t
    JOIN project_sprints s ON s.id = t.sprint_id
    WHERE t.project_id <> s.project_id
  ) OR EXISTS (
    SELECT 1 FROM project_task_submissions sub
    JOIN project_tasks t ON t.id = sub.task_id
    WHERE sub.project_id <> t.project_id
  ) THEN
    RAISE EXCEPTION 'DB073 project lineage mismatch; abort migration'
      USING ERRCODE = '23514';
  END IF;
END;
$db073_project_lineage_preflight$;

-- PostgreSQL composite FKs require unique targets. Existing UUID primary
-- keys remain intact. Do not replace/drop the independent UUID references.
CREATE UNIQUE INDEX IF NOT EXISTS project_releases_project_id_id_uq
  ON project_releases(project_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS project_sprints_project_id_id_uq
  ON project_sprints(project_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_project_id_id_uq
  ON project_tasks(project_id, id);

-- Release must belong to the same project as the sprint.
ALTER TABLE project_sprints
  ADD CONSTRAINT project_sprints_project_release_fk
  FOREIGN KEY (project_id, release_id)
  REFERENCES project_releases(project_id, id) ON DELETE RESTRICT;

-- Sprint must belong to the same project as the task.
ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_project_sprint_fk
  FOREIGN KEY (project_id, sprint_id)
  REFERENCES project_sprints(project_id, id) ON DELETE RESTRICT;

-- A task submission may only reference a task of its declared project.
ALTER TABLE project_task_submissions
  ADD CONSTRAINT project_task_submissions_project_task_fk
  FOREIGN KEY (project_id, task_id)
  REFERENCES project_tasks(project_id, id) ON DELETE RESTRICT;

-- Acceptance before any activation:
-- 1. Registered-schema and journal ordering / clean PG replay by Chat 1.
-- 2. All 3 existing-row mismatch probes return zero; abort if not.
-- 3. Catalog proves 3 composite FKs validated and referencing expected cols.
-- 4. Direct INSERT/UPDATE cross-project edges produce SQLSTATE 23503.
-- 5. Same-project edges including valid multiple projects continue to work.
-- 6. Replay alongside DB068/070/071 and DB03 group/member scope.
-- 7. Actual PostgreSQL and project materialization/service regression tests.
-- Nothing above is executed or registered by merely committing this file.
