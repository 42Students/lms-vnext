-- PROPOSAL ONLY. TPO-requests-verification-01; LEARNER-placements-51/52.
-- 0134 contains duplicate CREATE TABLE IF NOT EXISTS declarations; the first
-- is effective (five kinds, composite college/member FK, strict JSON object,
-- decision invariants, target_key varchar(150), status varchar(20)).
-- DECISION: retain this stronger canonical contract and add only the sixth kind.
-- All request identity keys fit varchar(150): company <=150, EDUCATION: + field
-- <=140 and UUID pairs <=73. Do not weaken constraints or widen the column.
-- Orchestrator registers a new numbered migration after disposable DB replay;
-- do not edit 0134. Existing five kinds and audit history remain unchanged.
BEGIN;
ALTER TABLE placement_learner_general_requests
 DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
ALTER TABLE placement_learner_general_requests
 ADD CONSTRAINT placement_general_request_kind_ck CHECK (
  kind IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
   'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE')
 );
COMMIT;
