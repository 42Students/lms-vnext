-- [chat-14] Legacy course metadata and offering/teacher/progress crosswalk.
-- Legacy integers are read-only source identities, never authorization scope.
ALTER TABLE courses ADD COLUMN legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_category varchar(120);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_course_type varchar(60);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_price_inr integer;
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN legacy_popularity_count integer;
--> statement-breakpoint
CREATE INDEX courses_legacy_id_idx ON courses(department_id,legacy_course_id)
 WHERE legacy_course_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE course_offerings ADD COLUMN legacy_semester_course_id integer;
--> statement-breakpoint
ALTER TABLE course_offerings ADD COLUMN legacy_sort_order integer;
--> statement-breakpoint
ALTER TABLE course_offerings ADD COLUMN legacy_was_elective boolean;
--> statement-breakpoint
CREATE INDEX course_offerings_legacy_semester_id_idx
 ON course_offerings(course_id,legacy_semester_course_id)
 WHERE legacy_semester_course_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ALTER COLUMN role SET DEFAULT 'PRIMARY';
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_mapping_id integer;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE course_teaching_assignments ADD COLUMN legacy_was_active boolean;
--> statement-breakpoint
CREATE INDEX course_teaching_assignments_legacy_mapping_idx
 ON course_teaching_assignments(delivery_id,legacy_mapping_id)
 WHERE legacy_mapping_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE learner_content_progress ADD COLUMN legacy_progress_id integer;
--> statement-breakpoint
ALTER TABLE learner_content_progress ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX learner_content_progress_active_latest_idx
 ON learner_content_progress(membership_id,lesson_content_id,attempt DESC)
 WHERE legacy_was_deleted IS NULL OR legacy_was_deleted = false;
