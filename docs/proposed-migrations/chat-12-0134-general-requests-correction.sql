-- PROPOSAL ONLY: no registered migration is changed by this file.
-- Target: separately numbered, reviewed additive migration for the effective
-- first CREATE TABLE in migration 0134.
-- Do not silently widen target_key to text: retain this stronger canonical contract
-- of varchar(150) with exact learner+college foreign key and pending-target uniqueness.
-- Input target values are individually validated to fit 150, including the
-- EDUCATION: field prefix (140-character field name maximum).
--
-- The new OFFER_ACCEPTANCE_DISPUTE kind is accepted by the validated request model,
-- but the effective 0134 placement_general_request_kind_ck omits it.
-- Register the following correction with a fresh migration number before enabling
-- persistence for that kind, so inserts do not violate the constraint.
-- PLACEMENT_AFTER_PLACEMENT is also kept here to preserve existing support.
ALTER TABLE placement_learner_general_requests
  DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
ALTER TABLE placement_learner_general_requests
  ADD CONSTRAINT placement_general_request_kind_ck
  CHECK (kind IN (
    'OFF_CAMPUS_OFFER',
    'REGISTRATION_CHANGE',
    'ABSENCE_DISPUTE',
    'CORRECTION_WITH_PROOF',
    'OFFER_ACCEPTANCE_DISPUTE',
    'PLACEMENT_AFTER_PLACEMENT'
  ));
