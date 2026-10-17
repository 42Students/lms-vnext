-- SA-placements-projects-05, SA-placements-projects-21; orchestrator registers numbered migration.
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_url text;
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_attached_at timestamptz;
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_attached_by_user_id uuid
 REFERENCES users(id) ON DELETE RESTRICT;
