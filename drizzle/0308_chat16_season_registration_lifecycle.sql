-- [chat-16] Preserve independent legacy season registration lifecycle.
-- Existing per-cohort invitation workflows keep working until a TPO
-- explicitly enables season-wide registration control for this college.
ALTER TABLE placement_seasons
  ADD COLUMN registration_controlled boolean NOT NULL DEFAULT false,
  ADD COLUMN is_registration_open boolean NOT NULL DEFAULT false,
  ADD COLUMN registration_deadline timestamptz;
--> statement-breakpoint
ALTER TABLE placement_seasons
  ADD CONSTRAINT placement_seasons_registration_control_ck CHECK (
    NOT is_registration_open OR (registration_controlled AND status = 'ACTIVE')
  );
