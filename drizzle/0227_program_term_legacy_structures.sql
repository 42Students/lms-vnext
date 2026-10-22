-- [chat-14] Historical structure/semester snapshots; status does not modify is_active behavior.
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_semester_id integer;
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_structure_id integer;
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_structure_status varchar(16);
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_start_date varchar(255);
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_end_date varchar(255);
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_course_ids jsonb;
--> statement-breakpoint
ALTER TABLE program_terms ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE program_terms ADD CONSTRAINT program_terms_legacy_structure_status_ck
 CHECK (legacy_structure_status IS NULL OR legacy_structure_status IN ('ACTIVE','INACTIVE','COMPLETED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS program_terms_legacy_structure_idx ON program_terms(program_id,legacy_structure_id)
 WHERE legacy_structure_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS program_terms_legacy_semester_idx ON program_terms(program_id,legacy_semester_id)
 WHERE legacy_semester_id IS NOT NULL;
