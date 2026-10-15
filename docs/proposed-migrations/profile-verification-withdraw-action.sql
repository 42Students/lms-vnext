-- PROPOSAL ONLY. Orchestrator must register/replay this migration before
-- an UPDATE_PENDING withdraw route can be exposed.
BEGIN;
ALTER TABLE profile_verification_events
  DROP CONSTRAINT profile_verification_events_action_ck;
ALTER TABLE profile_verification_events
  ADD CONSTRAINT profile_verification_events_action_ck
  CHECK (action IN ('SUBMITTED','UPDATE_SUBMITTED','VERIFIED','SENT_BACK','WITHDRAWN'));
COMMIT;
