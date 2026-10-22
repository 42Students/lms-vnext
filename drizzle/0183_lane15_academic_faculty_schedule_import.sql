-- Retain exact source attribution. A missing faculty remains an unassigned event.
ALTER TABLE section_faculty_assignments ADD COLUMN IF NOT EXISTS legacy_assignment_id integer,
 ADD COLUMN IF NOT EXISTS legacy_course_id integer,
 ADD COLUMN IF NOT EXISTS legacy_deactivated_at timestamptz,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS section_faculty_assignments_legacy_id_uq
 ON section_faculty_assignments(legacy_assignment_id) WHERE legacy_assignment_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE section_faculty_assignments ADD CONSTRAINT section_faculty_legacy_ended_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR ended_at IS NOT NULL)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE section_schedule_events ADD COLUMN IF NOT EXISTS legacy_schedule_id integer,
 ADD COLUMN IF NOT EXISTS legacy_course_slug varchar(120),
 ADD COLUMN IF NOT EXISTS legacy_room_number varchar(160),
 ADD COLUMN IF NOT EXISTS legacy_cancelled_at timestamptz;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS section_schedule_events_legacy_id_uq
 ON section_schedule_events(legacy_schedule_id) WHERE legacy_schedule_id IS NOT NULL;
