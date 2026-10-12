-- DB-074 / Chat 2 — SOURCE-STAGED ONLY; DO NOT APPLY AS A MIGRATION.
-- Sole registered-schema / numbered-migration integrator: Chat 1.
-- Source: src/db/schema/projects.ts, project_submissions,
-- project_submission_reviews and project_evaluations.
-- Greenfield project; no legacy production data migration.
--
-- Individual UUID FKs currently validate submission_id and project_id
-- independently. A project A review or evaluation can point at project B's
-- valid submission by direct SQL unless the combined ancestry is enforced.
--
-- PRE-FLIGHT SELECTS: must return zero before adding any constraints.
SELECT rev.id AS review_id,
       rev.project_id AS reviewed_project_id,
       sub.project_id AS submission_project_id
  FROM project_submission_reviews rev
  JOIN project_submissions sub ON sub.id = rev.submission_id
 WHERE rev.project_id <> sub.project_id;

SELECT ev.id AS evaluation_id,
       ev.project_id AS evaluated_project_id,
       sub.project_id AS submission_project_id
  FROM project_evaluations ev
  JOIN project_submissions sub ON sub.id = ev.submission_id
 WHERE ev.project_id <> sub.project_id;

DO $db074_review_evaluation_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM project_submission_reviews rev
      JOIN project_submissions sub ON sub.id = rev.submission_id
     WHERE rev.project_id <> sub.project_id
  ) OR EXISTS (
    SELECT 1
      FROM project_evaluations ev
      JOIN project_submissions sub ON sub.id = ev.submission_id
     WHERE ev.project_id <> sub.project_id
  ) THEN
    RAISE EXCEPTION 'DB074 review/evaluation project mismatch; abort migration'
      USING ERRCODE = '23514';
  END IF;
END;
$db074_review_evaluation_preflight$;

-- Parent project_id and id are both NOT NULL. Preserve the original UUID PK
-- and the independent FK constraints; the composite unique target is additive.
CREATE UNIQUE INDEX IF NOT EXISTS project_submissions_project_id_id_uq
  ON project_submissions(project_id, id);

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

-- Do not constrain a historic approved submission to remain actively open;
-- the parent survives later versions, approvals and archival.
-- Do not replace project/submission ownership permission checks in services:
-- these FKs are necessary but not sufficient to authorize reviewers.
--
-- Chat 1 integration acceptance requires:
-- 1) clean and current disposable PostgreSQL journal replay;
-- 2) both preflight SELECTs zero and DO abort test on deliberately dirty data;
-- 3) both pg_constraint entries validated with exact two-column ancestry;
-- 4) mismatched INSERT and UPDATE rejected SQLSTATE 23503 for both children;
-- 5) same-project review/evaluation inserts accepted, no broken review flows;
-- 6) test against concurrent parent project reassignment and role/tenant checks;
-- 7) preserve existing submission status/score CHECK and uniqueness semantics.
-- This file alone is not a runtime proof or schema registration.
