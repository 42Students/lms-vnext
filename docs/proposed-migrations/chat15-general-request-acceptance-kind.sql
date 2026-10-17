-- LEARNER-placements-43: 0134 created the request table with a five-kind CHECK.
-- Its later CREATE TABLE IF NOT EXISTS includes OFFER_ACCEPTANCE_DISPUTE, but is
-- a no-op once the first definition exists. Correct the registered constraint.
-- Orchestrator: register as a new numbered migration (never edit 0134).
-- A pending externally reported acceptance dispute must be persistable.
ALTER TABLE placement_learner_general_requests
  DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests
  ADD CONSTRAINT placement_general_request_kind_ck
  CHECK (kind IN (
    'OFF_CAMPUS_OFFER', 'REGISTRATION_CHANGE', 'ABSENCE_DISPUTE',
    'CORRECTION_WITH_PROOF', 'PLACEMENT_AFTER_PLACEMENT',
    'OFFER_ACCEPTANCE_DISPUTE'
  ));
