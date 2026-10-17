-- Proposal, NOT registered or applied. Owner must allocate a migration number.
-- SA-tenants-modules-58: optional announcement CTA label and absolute HTTPS destination.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS button_label varchar(60),
  ADD COLUMN IF NOT EXISTS button_url varchar(500);
ALTER TABLE announcements ADD CONSTRAINT announcements_cta_pair_ck
  CHECK ((button_label IS NULL AND button_url IS NULL)
      OR (button_label IS NOT NULL AND length(trim(button_label)) BETWEEN 1 AND 60
       AND button_url IS NOT NULL AND button_url ~ '^https://[^[:space:]]+$'));
-- SA-tenants-modules-59: per-college explicit read receipt, separate from
-- per-person in_app_notifications; a delivery is not a read event.
CREATE TABLE IF NOT EXISTS placement_cell_announcement_reads (
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  first_read_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  first_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id,college_id)
);
CREATE INDEX IF NOT EXISTS placement_cell_announcement_reads_by_college_idx
  ON placement_cell_announcement_reads(college_id, first_read_at DESC);
-- The matching authorized placement-cell read endpoint and producer will be
-- registered after this migration. Until then the UI MUST NOT show invented
-- read counts or write CTA fields that do not exist.
