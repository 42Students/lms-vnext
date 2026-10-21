-- [chat-14] Preserve historical absence-only rows and nullable mark actors. No synthetic native MARKED state.
ALTER TABLE attendance_sessions ADD COLUMN legacy_class_schedule_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN legacy_attendance_marked_at timestamptz;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE attendance_sessions ADD COLUMN legacy_faculty_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_attend_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_class_schedule_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_student_id text;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_attendance_status varchar(20);
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_absence_reason text;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_marked_by_id integer;
--> statement-breakpoint
ALTER TABLE attendance_records ADD COLUMN legacy_was_deleted boolean;
