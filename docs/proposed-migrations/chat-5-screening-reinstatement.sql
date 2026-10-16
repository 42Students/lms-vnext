-- PROPOSAL ONLY: COL-placements-01 Reinstatement of a rejected screening.
-- Register and test with a numbered database migration before enabling the action.
-- The update is an explicitly audited correction; previous rejection remains in history.
ALTER TABLE placement_application_screening_history
 DROP CONSTRAINT IF EXISTS placement_application_screening_history_transition_ck;
ALTER TABLE placement_application_screening_history
 ADD CONSTRAINT placement_application_screening_history_transition_ck CHECK(
   (from_status='PENDING' AND to_status IN ('HOLD','SHORTLISTED','REJECTED'))
   OR (from_status='HOLD' AND to_status IN ('SHORTLISTED','REJECTED'))
   OR (from_status='REJECTED' AND to_status='PENDING')
 );
ALTER TABLE placement_application_screening_history
 DROP CONSTRAINT IF EXISTS placement_application_screening_history_status_ck;
ALTER TABLE placement_application_screening_history
 ADD CONSTRAINT placement_application_screening_history_status_ck CHECK(
  from_status IN ('PENDING','HOLD','SHORTLISTED','REJECTED')
  AND to_status IN ('PENDING','HOLD','SHORTLISTED','REJECTED')
 );
-- Service action must use per-application locking and only offer REJECTED -> PENDING
-- if no terminal accepted offer or joining outcome exists.
