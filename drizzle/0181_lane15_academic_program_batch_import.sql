-- Numeric IDs and source year labels are nullable migration provenance, not authorization.
ALTER TABLE programs ADD COLUMN IF NOT EXISTS legacy_program_id integer,
 ADD COLUMN IF NOT EXISTS legacy_duration_years integer,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS programs_legacy_id_uq ON programs(legacy_program_id)
 WHERE legacy_program_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE programs ADD CONSTRAINT programs_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status<>'ACTIVE')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE academic_periods ADD COLUMN IF NOT EXISTS legacy_academic_year_name varchar(32);
--> statement-breakpoint
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS legacy_batch_id integer,
 ADD COLUMN IF NOT EXISTS legacy_academic_year_raw varchar(32),
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS cohorts_legacy_batch_id_uq ON cohorts(legacy_batch_id)
 WHERE legacy_batch_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE cohorts ADD CONSTRAINT cohorts_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='ARCHIVED')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
