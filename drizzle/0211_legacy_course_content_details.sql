-- [chat-14] Preserve historical course, content and faculty assignment metadata.
-- This adds fields only; normalized vNext content shapes and publish lifecycle
-- are unchanged. Lane 15 owns journal registration after reader/importer review.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS introduction_heading text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ordered_takeaways jsonb;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS legacy_academic_year varchar(16);
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS legacy_semester_number integer;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS legacy_content_data jsonb;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS legacy_content_type varchar(80);
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS legacy_faculty_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS legacy_active boolean;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS deleted_with_lesson boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS deadline_local timestamp without time zone;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
