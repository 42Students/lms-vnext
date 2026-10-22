-- [chat-14] Backwards-compatible legacy fidelity fields only.
-- Runtime reader/permission/CAS adoption is handed off, not claimed complete.
-- Lane 15 owns registering this migration in the Drizzle journal.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug varchar(64);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS parent_course_id uuid REFERENCES courses(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS legacy_metadata jsonb;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS legacy_allowed_for_display integer;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_uq ON courses(slug) WHERE slug IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS courses_visible_department_idx
 ON courses(department_id, status, enabled) WHERE deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS course_lessons_live_learner_idx
 ON course_lessons(learning_path_id, sequence)
 WHERE status = 'ACTIVE' AND visible_to_students = true AND deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS start_date date;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS end_date date;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS course_teaching_assignments_membership_dates_idx
 ON course_teaching_assignments(membership_id, start_date, end_date);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_teaching_assignments
 ADD CONSTRAINT course_teaching_assignments_date_order_ck
 CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
