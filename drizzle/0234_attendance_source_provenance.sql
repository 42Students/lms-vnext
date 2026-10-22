-- [chat-14] Preserve historical absence-only rows and nullable mark actors. No synthetic native MARKED state.
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS legacy_class_schedule_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS legacy_attendance_marked_at timestamptz;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS legacy_faculty_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_attend_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_class_schedule_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_student_id text;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_attendance_status varchar(20);
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_absence_reason text;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_marked_by_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
