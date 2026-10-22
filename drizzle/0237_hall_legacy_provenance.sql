-- [chat-14] Source lecture hall ID/ordinal preservation; needs tenant-safe importer review.
ALTER TABLE lecture_halls ADD COLUMN IF NOT EXISTS legacy_lecture_hall_id integer;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN IF NOT EXISTS legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN IF NOT EXISTS legacy_department_id integer;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN IF NOT EXISTS legacy_room_type_ordinal integer;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
ALTER TABLE lecture_halls ALTER COLUMN description TYPE text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lecture_halls_legacy_source_idx ON lecture_halls(college_id,legacy_lecture_hall_id) WHERE legacy_lecture_hall_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE lecture_halls ADD CONSTRAINT lecture_halls_legacy_room_type_ordinal_ck CHECK (legacy_room_type_ordinal IS NULL OR legacy_room_type_ordinal BETWEEN 0 AND 5)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
