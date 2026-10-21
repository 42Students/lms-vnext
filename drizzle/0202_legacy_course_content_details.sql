-- [chat-14] Preserve historical course, content and faculty assignment metadata.
-- This adds fields only; normalized vNext content shapes and publish lifecycle
-- are unchanged. Lane 15 owns journal registration after reader/importer review.
ALTER TABLE courses ADD COLUMN introduction_heading text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN image_url text;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN ordered_takeaways jsonb;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_academic_year varchar(16);
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_semester_number integer;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN legacy_content_data jsonb;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN legacy_content_type varchar(80);
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN legacy_faculty_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN legacy_active boolean;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN deleted_with_lesson boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN deadline_local timestamp without time zone;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD COLUMN version bigint NOT NULL DEFAULT 0;
