-- PROPOSED / NOT REGISTERED: P-S2-07 and P-S2-12.
-- The orchestrator owns migration numbering, Drizzle barrel/journal/snapshot,
-- replay and approval. Never execute this file in production directly.
-- Read with the existing placement_jobs / placement_offers status constraints.
BEGIN;
ALTER TABLE placement_jobs DROP CONSTRAINT IF EXISTS placement_jobs_status_ck;
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_status_ck
  CHECK (status IN ('DRAFT','PUBLISHED','CLOSED','ARCHIVED','CANCELLED'));
ALTER TABLE placement_jobs DROP CONSTRAINT IF EXISTS placement_jobs_lifecycle_ck;
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_lifecycle_ck CHECK (
    (status='DRAFT' AND published_at IS NULL AND closed_at IS NULL AND archived_at IS NULL)
 OR (status='PUBLISHED' AND published_at IS NOT NULL AND closed_at IS NULL AND archived_at IS NULL)
 OR (status='CLOSED' AND published_at IS NOT NULL AND closed_at IS NOT NULL AND archived_at IS NULL)
 OR (status='CANCELLED' AND published_at IS NOT NULL AND closed_at IS NOT NULL AND archived_at IS NULL)
 OR (status='ARCHIVED' AND archived_at IS NOT NULL)
);
ALTER TABLE placement_offers DROP CONSTRAINT IF EXISTS placement_offers_status_ck;
ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_status_ck
  CHECK (status IN ('ISSUED','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED'));
ALTER TABLE placement_offers DROP CONSTRAINT IF EXISTS placement_offers_lifecycle_ck;
ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_lifecycle_ck CHECK (
    (status IN ('ISSUED','EXPIRED') AND responded_by_user_id IS NULL AND responded_at IS NULL AND withdrawn_by_user_id IS NULL AND withdrawn_at IS NULL)
 OR (status IN ('ACCEPTED','DECLINED') AND responded_by_user_id IS NOT NULL AND responded_at IS NOT NULL AND withdrawn_by_user_id IS NULL AND withdrawn_at IS NULL)
 OR (status='WITHDRAWN' AND withdrawn_by_user_id IS NOT NULL AND withdrawn_at IS NOT NULL)
);
ALTER TABLE placement_offer_status_history DROP CONSTRAINT IF EXISTS placement_offer_status_history_status_ck;
ALTER TABLE placement_offer_status_history ADD CONSTRAINT placement_offer_status_history_status_ck CHECK (
  (from_status IS NULL OR from_status IN ('ISSUED','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED'))
   AND to_status IN ('ISSUED','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED')
);
ALTER TABLE placement_offer_status_history DROP CONSTRAINT IF EXISTS placement_offer_status_history_transition_ck;
ALTER TABLE placement_offer_status_history ADD CONSTRAINT placement_offer_status_history_transition_ck CHECK (
  (from_status IS NULL AND to_status='ISSUED')
 OR (from_status='ISSUED' AND to_status IN ('ACCEPTED','DECLINED','WITHDRAWN','EXPIRED'))
 OR (from_status='ACCEPTED' AND to_status='WITHDRAWN')
);
COMMIT;
-- NOT INCLUDED until approved: expiry sweep, candidate-state propagation,
-- job cancellation caller transition, migration replay, and DB concurrency proof.
