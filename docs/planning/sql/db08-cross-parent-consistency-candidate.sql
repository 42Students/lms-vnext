-- DB-066 / Chat 3. ISOLATED CANDIDATE, not a registered migration.
-- No live database execution. Chat 1 exclusively owns drizzle/* and the
-- schema barrel. Do not apply this directly to prod.
--
-- Source: src/db/schema/placements.ts @ main 2026-10-12.
-- A FK to a round UUID and a separate FK to an application UUID do not prove
-- that the application belongs to the round's job. Similarly, a role option
-- UUID alone does not prove that it belongs to the application's job.
--
-- INTEGRATOR DEPENDENCIES, in order:
-- A) db09-parent-composite-keys-candidate.sql (or equivalent declared UNIQUE):
--    placement_applications(id,job_id), placement_job_rounds(id,job_id).
-- B) Existing placement tables, populated and coherent, if any.
-- C) Compare the candidate with existing Drizzle schema to avoid duplication.
--
-- WITNESS 0: fail before *any* parent/child ALTER when current persisted
-- rows contradict same-job/same-application relationships.
DO $db066_preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM placement_applications a
    JOIN placement_job_role_options role ON role.id = a.role_option_id
    WHERE a.job_id IS DISTINCT FROM role.job_id
  ) THEN RAISE EXCEPTION 'DB066: application role option belongs to another job';
  END IF;
  IF EXISTS (
    SELECT 1 FROM placement_round_results result
    JOIN placement_job_rounds round ON round.id = result.round_id
    JOIN placement_applications a ON a.id = result.application_id
    WHERE round.job_id IS DISTINCT FROM a.job_id
  ) THEN RAISE EXCEPTION 'DB066: round result crosses jobs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM placement_learner_requests req
    JOIN placement_applications a ON a.id = req.application_id
    LEFT JOIN placement_job_rounds round ON round.id = req.round_id
    LEFT JOIN placement_offers offer ON offer.id = req.offer_id
    WHERE (req.round_id IS NOT NULL AND round.job_id IS DISTINCT FROM a.job_id)
       OR (req.offer_id IS NOT NULL AND offer.application_id IS DISTINCT FROM a.id)
  ) THEN RAISE EXCEPTION 'DB066: learner request targets another application/job';
  END IF;
  IF EXISTS (
    SELECT 1 FROM placement_application_round_exceptions exception
    JOIN placement_applications a ON a.id = exception.application_id
    JOIN placement_job_rounds round ON round.id = exception.round_id
    JOIN placement_learner_requests req ON req.id = exception.request_id
    WHERE round.job_id IS DISTINCT FROM a.job_id
       OR req.application_id IS DISTINCT FROM a.id
       OR req.round_id IS DISTINCT FROM round.id
       OR req.request_type <> 'ROUND_RESCHEDULE'
  ) THEN RAISE EXCEPTION 'DB066: exception references unrelated reschedule request';
  END IF;
END;
$db066_preflight$;

-- Parent composite keys are superkeys in PostgreSQL, required by FKs.
-- The id columns remain the original primary keys.
ALTER TABLE placement_job_role_options
  ADD CONSTRAINT db066_role_option_id_job_uq UNIQUE (id, job_id);
ALTER TABLE placement_offers
  ADD CONSTRAINT db066_offer_id_application_uq UNIQUE (id, application_id);
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT db066_request_id_application_round_type_uq
  UNIQUE (id, application_id, round_id, request_type);

-- Protect *every* application insert/update, including admin imports and
-- non-self-submit routes that do not hit db08_self_application_gate.
ALTER TABLE placement_applications
  ADD CONSTRAINT db066_application_role_same_job_fk
  FOREIGN KEY (role_option_id, job_id)
  REFERENCES placement_job_role_options(id, job_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Round result: dual composite FKs share one nonnullable job_id. Two
-- independently valid round/application IDs can no longer disagree about job.
ALTER TABLE placement_round_results ADD COLUMN job_id uuid;
UPDATE placement_round_results result SET job_id = a.job_id
 FROM placement_applications a WHERE result.application_id = a.id;
ALTER TABLE placement_round_results ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE placement_round_results
  ADD CONSTRAINT db066_round_result_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db066_round_result_application_job_fk
    FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Request: bind the referenced round to the request's application job,
-- and the referenced offer to the *exact* request application.
ALTER TABLE placement_learner_requests ADD COLUMN job_id uuid;
UPDATE placement_learner_requests req SET job_id = a.job_id
 FROM placement_applications a WHERE req.application_id = a.id;
ALTER TABLE placement_learner_requests ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT db066_request_application_job_fk
    FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db066_request_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db066_request_offer_application_fk
    FOREIGN KEY (offer_id, application_id)
    REFERENCES placement_offers(id, application_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Reschedule exception: enforce same job and exact
-- (request,application,round,request_type). Keeping request_type in the child
-- prevents a later direct-SQL parent mutation from turning the linked
-- ROUND_RESCHEDULE into a withdrawal/offer-extension request while retaining
-- the same UUIDs.
ALTER TABLE placement_application_round_exceptions
  ADD COLUMN job_id uuid,
  ADD COLUMN request_type varchar(40);
UPDATE placement_application_round_exceptions exception
   SET job_id = a.job_id,
       request_type = req.request_type
  FROM placement_applications a,
       placement_learner_requests req
 WHERE exception.application_id = a.id
   AND exception.request_id = req.id;
ALTER TABLE placement_application_round_exceptions
  ALTER COLUMN job_id SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL;
ALTER TABLE placement_application_round_exceptions
  ADD CONSTRAINT db066_exception_request_type_ck
    CHECK (request_type = 'ROUND_RESCHEDULE');
ALTER TABLE placement_application_round_exceptions
  ADD CONSTRAINT db066_exception_application_job_fk
    FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db066_exception_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db066_exception_request_scope_fk
    FOREIGN KEY (request_id, application_id, round_id, request_type)
    REFERENCES placement_learner_requests(id, application_id, round_id, request_type)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- W01 NOTES:
-- 1) The new NOT NULL job_id columns must also be present in Drizzle schema
--    and transactional writers/readers BEFORE registration. This is a design
--    draft, not currently API compatible.
-- 2) Reuse DB09 parent constraints, NEVER register duplicated UNIQUEs.
-- 3) Composite FK equality alone does not prove the request was APPROVED,
--    that a round belongs to an authorized recruiter, or that a member
--    belongs to the job's college. Those require separate acceptance.
-- 4) During live backfill lock writers or use a reviewed online migration.
-- 5) Run disposable PostgreSQL negative witnesses, including two sessions
--    and UPDATE/parent-reassignment races; source-file asserts are NOT PG proof.
-- 6) An exception's request_type is deliberately duplicated as an integrity
--    discriminator. The API must not treat it as independently writable;
--    it is populated from the linked request and fixed to ROUND_RESCHEDULE.
