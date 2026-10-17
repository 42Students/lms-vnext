-- PROPOSAL ONLY. TPO-requests-verification-01.
-- Migration 0134 contains two CREATE TABLE IF NOT EXISTS declarations.
-- The first wins: target_key varchar(150), and the first kind CHECK permits five kinds.
-- Do not edit, renumber, or re-run 0134. The orchestrator must register and
-- independently replay this change on disposable PostgreSQL.
BEGIN;
ALTER TABLE placement_learner_general_requests
  ALTER COLUMN target_key TYPE text;
ALTER TABLE placement_learner_general_requests
  DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
ALTER TABLE placement_learner_general_requests
  ADD CONSTRAINT placement_general_request_kind_ck CHECK (
    kind IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
      'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE')
  );
COMMIT;
