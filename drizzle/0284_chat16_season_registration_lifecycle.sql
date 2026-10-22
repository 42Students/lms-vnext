-- [chat-16] Preserve independent legacy season registration lifecycle.
-- Existing per-cohort invitation workflows keep working until a TPO
-- explicitly enables season-wide registration control for this college.
ALTER TABLE placement_seasons
  ADD COLUMN IF NOT EXISTS registration_controlled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_registration_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_seasons
  ADD CONSTRAINT placement_seasons_registration_control_ck CHECK (
    NOT is_registration_open OR (registration_controlled AND status = 'ACTIVE')
  )$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
