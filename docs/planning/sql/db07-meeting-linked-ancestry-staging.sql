-- DB-075 / Chat 2 — DRAFT ONLY. NOT IN DRIZZLE JOURNAL.
-- Chat1 is sole schema barrel + numbered migration integrator.
-- Current vNext src/db/schema/projects.ts:
-- project_meetings.project_id -> project_instances.id
-- project_meetings.linked_sprint_id -> project_sprints.id (nullable)
-- project_meetings.linked_task_id -> project_tasks.id (nullable)
-- These independent FKs permit cross-project meeting links and, even within
-- one project, an asserted sprint A plus a task belonging to sprint B.
-- No legacy production data migration is required.

-- PRE-FLIGHT: all mismatch rows must be zero before registering constraints.
SELECT m.id, m.project_id AS meeting_project, s.project_id AS sprint_project
  FROM project_meetings m
  JOIN project_sprints s ON s.id = m.linked_sprint_id
 WHERE m.project_id <> s.project_id;

SELECT m.id, m.project_id AS meeting_project, t.project_id AS task_project
  FROM project_meetings m
  JOIN project_tasks t ON t.id = m.linked_task_id
 WHERE m.project_id <> t.project_id;

SELECT m.id, m.linked_sprint_id, t.sprint_id AS task_actual_sprint
  FROM project_meetings m
  JOIN project_tasks t ON t.id = m.linked_task_id
 WHERE m.linked_sprint_id IS NOT NULL
   AND m.linked_sprint_id <> t.sprint_id;

DO $db075_meeting_link_preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM project_meetings m
    JOIN project_sprints s ON s.id = m.linked_sprint_id
    WHERE m.project_id <> s.project_id
  ) OR EXISTS (
    SELECT 1 FROM project_meetings m
    JOIN project_tasks t ON t.id = m.linked_task_id
    WHERE m.project_id <> t.project_id
  ) OR EXISTS (
    SELECT 1 FROM project_meetings m
    JOIN project_tasks t ON t.id = m.linked_task_id
    WHERE m.linked_sprint_id IS NOT NULL
      AND m.linked_sprint_id <> t.sprint_id
  ) THEN
    RAISE EXCEPTION 'DB075 meeting reference ancestry mismatch; abort migration'
      USING ERRCODE = '23514';
  END IF;
END;
$db075_meeting_link_preflight$;

-- DB073 proposes the first two same indexes. The integrator must register
-- each index only once after reconciling current main / generated Drizzle.
-- The final sprint_id,id unique index is new and independent.
CREATE UNIQUE INDEX IF NOT EXISTS project_sprints_project_id_id_uq
  ON project_sprints(project_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_project_id_id_uq
  ON project_tasks(project_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_sprint_id_id_uq
  ON project_tasks(sprint_id, id);

-- NULL linked_sprint_id is legal for general and task-only meetings. All
-- project IDs are NOT NULL: when a link exists its owner is always checked.
ALTER TABLE project_meetings
  ADD CONSTRAINT project_meetings_project_sprint_fk
  FOREIGN KEY (project_id, linked_sprint_id)
  REFERENCES project_sprints(project_id, id)
  ON DELETE RESTRICT;

ALTER TABLE project_meetings
  ADD CONSTRAINT project_meetings_project_task_fk
  FOREIGN KEY (project_id, linked_task_id)
  REFERENCES project_tasks(project_id, id)
  ON DELETE RESTRICT;

-- MATCH SIMPLE intentionally skips the paired FK when either link is NULL:
-- task-only and sprint-only meetings are valid. When BOTH are present, the
-- task must belong to exactly the explicitly linked sprint.
ALTER TABLE project_meetings
  ADD CONSTRAINT project_meetings_linked_sprint_task_fk
  FOREIGN KEY (linked_sprint_id, linked_task_id)
  REFERENCES project_tasks(sprint_id, id)
  ON DELETE RESTRICT;

-- Integration gates: triage/read zero mismatches; test dirty-state DO abort;
-- clean and current Drizzle/PG replay; 3 validated catalog FKs; positive
-- general, sprint-only, task-only, same-sprint task-linked meeting inserts;
-- negative cross-project and same-project/cross-sprint INSERT/UPDATE (23503).
-- Concurrent task reassignment, meeting edits, tenant authorization and
-- meeting status transitions need further service/race acceptance.
-- No activation or runtime tests occur merely by committing this proposal.
