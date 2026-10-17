-- PROPOSAL ONLY: TPO-requests-verification-01. DO NOT APPLY OR COMMIT TO drizzle/.
-- This is a prospective additive design for an orchestrator-approved migration.
-- Current read services INNER JOIN placement_applications and assume application_id NOT NULL.
-- Therefore do not execute this SQL before: (1) college-scoped reader rewrite,
-- (2) discriminated Zod payload schemas + transactional kind-specific service effects,
-- (3) college/RBAC and history/notification guards, (4) migration acceptance tests.
-- The five proposed kinds are OFF_CAMPUS_OFFER, REGISTRATION_CHANGE,
-- ABSENCE_DISPUTE, CORRECTION_WITH_PROOF, PLACEMENT_AFTER_PLACEMENT.
BEGIN;
ALTER TABLE placement_learner_requests
  ADD COLUMN IF NOT EXISTS learner_membership_id uuid;
-- Backfill legacy applications without rewriting their immutable effect_payload.
UPDATE placement_learner_requests AS r
SET learner_membership_id = a.membership_id
FROM placement_applications AS a
WHERE r.application_id=a.id AND r.learner_membership_id IS NULL;
-- Abort migration if even a single legacy request cannot be matched safely:
DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM placement_learner_requests WHERE learner_membership_id IS NULL)
 THEN RAISE EXCEPTION 'Unmatched historic learner requests; investigate before migrating';
 END IF;
END $$;
ALTER TABLE placement_learner_requests
  ALTER COLUMN learner_membership_id SET NOT NULL;
ALTER TABLE placement_learner_requests
  ALTER COLUMN application_id DROP NOT NULL;
ALTER TABLE placement_learner_requests
  DROP CONSTRAINT placement_learner_requests_type_ck;
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT placement_learner_requests_type_ck
  CHECK (request_type IN (
   'APPLICATION_WITHDRAWAL','ROUND_RESCHEDULE','OFFER_EXTENSION',
   'OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
   'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT'
  ));
ALTER TABLE placement_learner_requests
  DROP CONSTRAINT placement_learner_requests_target_shape_ck;
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT placement_learner_requests_target_shape_ck
  CHECK (
   (request_type='APPLICATION_WITHDRAWAL' AND application_id IS NOT NULL AND round_id IS NULL AND offer_id IS NULL)
   OR (request_type='ROUND_RESCHEDULE' AND application_id IS NOT NULL AND round_id IS NOT NULL AND offer_id IS NULL)
   OR (request_type='OFFER_EXTENSION' AND application_id IS NOT NULL AND round_id IS NULL AND offer_id IS NOT NULL)
   OR (request_type IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
       'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')
       AND round_id IS NULL AND offer_id IS NULL AND jsonb_typeof(effect_payload)='object')
  );
-- College scope for requests with no application must be derived from membership
-- and verified in the service inside the same transaction; add FK in real migration.
-- Do not approve a new kind by flipping status alone. Each effect must be atomic.
COMMIT;
