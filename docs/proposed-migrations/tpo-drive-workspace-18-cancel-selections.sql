-- TPO-drive-workspace-18
-- Proposed only: orchestrator must register and replay this change before
-- a drive with SELECTED/VERIFIED company selections can be cancelled.
-- Previous released selections remain immutable, attached to their official offers.
ALTER TABLE placement_drive_selections
  DROP CONSTRAINT IF EXISTS placement_drive_selections_status_ck;
ALTER TABLE placement_drive_selections
  ADD CONSTRAINT placement_drive_selections_status_ck
  CHECK (status IN ('SELECTED','VERIFIED','RELEASED','CANCELLED'));
ALTER TABLE placement_drive_selections
  DROP CONSTRAINT IF EXISTS placement_drive_selections_verified_ck;
ALTER TABLE placement_drive_selections
  ADD CONSTRAINT placement_drive_selections_verified_ck
  CHECK (
    (status='SELECTED' AND verified_at IS NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status='VERIFIED' AND verified_at IS NOT NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status='RELEASED' AND verified_at IS NOT NULL AND released_offer_id IS NOT NULL AND released_at IS NOT NULL)
    OR (status='CANCELLED' AND released_at IS NULL AND released_offer_id IS NULL)
  );
