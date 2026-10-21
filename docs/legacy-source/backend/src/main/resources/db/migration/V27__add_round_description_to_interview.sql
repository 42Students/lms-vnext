-- Add mandatory round description for interview notifications (what the round is about).
-- Nullable for existing rows; application enforces non-blank when scheduling.
ALTER TABLE interview ADD COLUMN round_description TEXT NULL AFTER notes;
