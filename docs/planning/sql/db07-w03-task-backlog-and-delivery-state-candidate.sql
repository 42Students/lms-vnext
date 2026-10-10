-- W03 / DB07 staged SQL candidate only.
-- DO NOT register this file in drizzle/meta/_journal.json from W03.
-- W01 owns migration numbering, Drizzle schema reconciliation and replay.
--
-- Legacy evidence:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   ProjectWorkspaceServiceImpl.completeSprint moves unfinished tasks out of the
--   completed sprint and records carriedOverFromSprintKey.
--   reopenSprint requires an explicit un-ship before reopening a sprint.
--   Delivery review supports REQUEST_CHANGES / ACCEPT / LOCK / REOPEN and
--   distinguishes Under Review and Locked states.
--
-- This candidate deliberately does not alter project_submissions yet. The
-- current vNext model uses immutable version rows and one review per submission;
-- faithfully representing legacy REOPEN/LOCK needs the staged delivery-event
-- table plus a decision on multi-review-per-version semantics. W01/W03 must
-- settle that domain contract before migrating review state.
--
-- Part A: sprint backlog / carry-over.
-- Current vNext project_tasks.sprint_id is NOT NULL, which makes the legacy
-- "unfinished work returns to backlog" completion behavior impossible.
ALTER TABLE project_tasks
  ALTER COLUMN sprint_id DROP NOT NULL;

ALTER TABLE project_tasks
  ADD COLUMN carried_over_from_sprint_id uuid NULL;

-- Same-project ownership for the active sprint link is owned by
-- db07-w03-core-project-relationship-integrity-candidate.sql, which creates
-- project_sprints_project_id_id_uq and project_tasks_project_sprint_fk.
-- This backlog draft owns only the nullable backlog transition and the
-- additional carry-over provenance FK; do not redeclare the core FK/index here.

ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_project_carryover_sprint_fk
  FOREIGN KEY (project_id, carried_over_from_sprint_id)
  REFERENCES project_sprints(project_id, id)
  ON DELETE RESTRICT;

CREATE INDEX project_tasks_project_backlog_idx
  ON project_tasks(project_id, sequence, updated_at)
  WHERE sprint_id IS NULL;

CREATE INDEX project_tasks_carryover_idx
  ON project_tasks(project_id, carried_over_from_sprint_id)
  WHERE carried_over_from_sprint_id IS NOT NULL;

-- W01 replay/negative tests required before promotion:
-- 1. task with project A + sprint from project B must fail FK.
-- 2. backlog task with sprint_id NULL must persist.
-- 3. carry-over sprint from another project must fail FK.
-- 4. completing a sprint must atomically move every non-DONE task to backlog,
--    set carried_over_from_sprint_id to that sprint, and then mark sprint complete.
-- 5. DONE tasks remain attached to the completed sprint.
-- 6. concurrent sprint completion/reassignment cannot strand a task in a closed sprint.
--
-- Part B: delivery review state is intentionally NOT migrated in this candidate.
-- Required follow-up before SQL:
-- - decide how vNext versioned project_submissions represents legacy Under Review/Locked;
-- - remove project_submission_reviews_submission_uq only if multiple review cycles per
--   same version are the chosen normalized model;
-- - wire project_delivery_events first so REOPEN/LOCK audit history is immutable;
-- - retain exactly one open editable/submitted delivery per project at a time.
