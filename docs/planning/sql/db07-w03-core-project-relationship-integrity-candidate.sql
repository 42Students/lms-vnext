-- W03 DB07 DRAFT ONLY — NOT registered in drizzle/meta/_journal.json.
-- W01 is the sole migration-journal owner. Review/generate/replay this as a
-- numbered Drizzle migration before treating any constraint below as live.
--
-- Goal: enforce the same-project invariants that W03 services already check.
-- A privileged/direct SQL writer must not be able to pair a project_id from
-- Project A with release/sprint/task/submission IDs from Project B.
--
-- Greenfield system: no legacy data backfill. Before promotion, W01 should run
-- orphan/cross-project probes on a disposable database, add the canonical
-- Drizzle schema relations/indexes, replay from zero and run negative SQL tests.

-- Referenced composite keys. PostgreSQL requires a UNIQUE target for each
-- composite FK. Existing UUID PKs remain unchanged.
CREATE UNIQUE INDEX IF NOT EXISTS
  project_releases_project_id_id_uq
  ON project_releases(project_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS
  project_sprints_project_id_id_uq
  ON project_sprints(project_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS
  project_tasks_project_id_id_uq
  ON project_tasks(project_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS
  project_submissions_project_id_id_uq
  ON project_submissions(project_id, id);

-- A sprint may reference only a release owned by that same project.
ALTER TABLE project_sprints
  ADD CONSTRAINT project_sprints_project_release_fk
  FOREIGN KEY (project_id, release_id)
  REFERENCES project_releases(project_id, id)
  ON DELETE RESTRICT;

-- A task may reference only a sprint owned by that same project.
ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_project_sprint_fk
  FOREIGN KEY (project_id, sprint_id)
  REFERENCES project_sprints(project_id, id)
  ON DELETE RESTRICT;

-- A task submission may reference only a task owned by that same project.
ALTER TABLE project_task_submissions
  ADD CONSTRAINT project_task_submissions_project_task_fk
  FOREIGN KEY (project_id, task_id)
  REFERENCES project_tasks(project_id, id)
  ON DELETE RESTRICT;

-- Final-delivery reviews and evaluations must point at a submission from the
-- same project whose history is being reviewed/scored.
ALTER TABLE project_submission_reviews
  ADD CONSTRAINT project_submission_reviews_project_submission_fk
  FOREIGN KEY (project_id, submission_id)
  REFERENCES project_submissions(project_id, id)
  ON DELETE RESTRICT;

ALTER TABLE project_evaluations
  ADD CONSTRAINT project_evaluations_project_submission_fk
  FOREIGN KEY (project_id, submission_id)
  REFERENCES project_submissions(project_id, id)
  ON DELETE RESTRICT;

-- Optional meeting links are independently project-scoped. The W03 service
-- additionally validates that linkedTaskId belongs to linkedSprintId whenever
-- both are supplied; retain that application invariant because either meeting
-- link may legitimately be NULL.
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

-- W01 promotion evidence required:
-- 1. zero-to-head Drizzle replay succeeds;
-- 2. schema snapshot contains all four composite UNIQUE targets + seven FKs;
-- 3. direct SQL cross-project inserts/updates fail with SQLSTATE 23503;
-- 4. normal W03 project materialization/task submission/final review/meeting
--    integration suites still pass;
-- 5. no constraint is marked validated unless the replay/test evidence exists.
