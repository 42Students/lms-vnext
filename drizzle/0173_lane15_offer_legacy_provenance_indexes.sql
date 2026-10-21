-- Historic chronological ordering is preserved separately from issued_at.
ALTER TABLE placement_offers
 ADD COLUMN IF NOT EXISTS legacy_offer_id integer,
 ADD COLUMN IF NOT EXISTS legacy_created_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS placement_offers_legacy_id_uq
 ON placement_offers(legacy_offer_id) WHERE legacy_offer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS placement_offers_expiry_due_idx
 ON placement_offers(expires_at) WHERE status='ISSUED' AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS placement_offers_dispute_due_idx
 ON placement_offers(accepted_disputable_until)
 WHERE status='ACCEPTED' AND accepted_disputable_until IS NOT NULL;
