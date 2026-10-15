-- Proposed only. Orchestrator must register a numbered Drizzle migration
-- after review and execute replay and SQL history/role/tenant tests.
-- P-S1-05: persisted classification instead of pretending all jobs are non-dream.
ALTER TABLE placement_jobs
  ADD COLUMN IF NOT EXISTS is_dream boolean NOT NULL DEFAULT false;

-- P-S1-06 / P-S2-11: auditable undo/re-application transitions.
-- Existing reversal code must NOT go live before these constraints are registered.
ALTER TABLE placement_offer_status_history
  DROP CONSTRAINT IF EXISTS placement_offer_status_history_transition_ck;
ALTER TABLE placement_offer_status_history
  ADD CONSTRAINT placement_offer_status_history_transition_ck CHECK (
    (from_status IS NULL AND to_status = 'ISSUED')
    OR (from_status = 'ISSUED' AND to_status IN ('ACCEPTED','DECLINED','WITHDRAWN'))
    OR (from_status = 'ACCEPTED' AND to_status IN ('WITHDRAWN','ISSUED'))
    OR (from_status = 'DECLINED' AND to_status = 'ISSUED')
  );
ALTER TABLE placement_application_status_history
  DROP CONSTRAINT IF EXISTS placement_application_status_history_transition_ck;
ALTER TABLE placement_application_status_history
  ADD CONSTRAINT placement_application_status_history_transition_ck CHECK (
    (from_status IS NULL AND to_status = 'SUBMITTED')
    OR (from_status = 'SUBMITTED' AND to_status = 'WITHDRAWN')
    OR (from_status = 'WITHDRAWN' AND to_status = 'SUBMITTED')
  );
-- DB migration owner must also define rollback, backfill classification,
-- concurrency acceptance and a durable indexed cascade action identifier.

-- Enable indexed lookup for explicit cascade correlation after registration.
-- Existing history reasons carry the accepted and affected row IDs; the
-- proposed structured id is reserved for typed follow-up migration mapping.
ALTER TABLE placement_offer_status_history
  ADD COLUMN IF NOT EXISTS cascade_id uuid;
ALTER TABLE placement_application_status_history
  ADD COLUMN IF NOT EXISTS cascade_id uuid;
CREATE INDEX IF NOT EXISTS placement_offer_history_cascade_id_idx
  ON placement_offer_status_history(cascade_id) WHERE cascade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS placement_application_history_cascade_id_idx
  ON placement_application_status_history(cascade_id) WHERE cascade_id IS NOT NULL;
