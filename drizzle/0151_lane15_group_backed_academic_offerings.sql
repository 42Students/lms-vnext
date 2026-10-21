-- Legacy GROUP_BACKED classes get their own group-based audience, not fake sections.
ALTER TABLE sections
  ADD COLUMN starts_on date,
  ADD COLUMN ends_on date;
--> statement-breakpoint
ALTER TABLE sections ADD CONSTRAINT sections_date_pair_ck
 CHECK ((starts_on IS NULL AND ends_on IS NULL)
   OR (starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on >= starts_on));
--> statement-breakpoint
CREATE TABLE group_backed_class_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_period_id uuid NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT,
  roster_group_id uuid NOT NULL REFERENCES lms_groups(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  starts_on date,
  ends_on date,
  status varchar(16) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_backed_offerings_status_ck CHECK (status IN ('ACTIVE','ARCHIVED')),
  CONSTRAINT group_backed_offerings_name_ck CHECK (length(trim(name)) > 0),
  CONSTRAINT group_backed_offerings_date_ck CHECK ((starts_on IS NULL AND ends_on IS NULL)
    OR (starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on >= starts_on))
);
--> statement-breakpoint
CREATE UNIQUE INDEX group_backed_offerings_period_group_uq ON group_backed_class_offerings(academic_period_id,roster_group_id);
--> statement-breakpoint
CREATE INDEX group_backed_offerings_group_status_idx ON group_backed_class_offerings(roster_group_id,status);
