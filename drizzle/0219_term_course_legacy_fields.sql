-- [chat-14] Preserve raw semester_course mapping metadata independently of canonical offering type.
ALTER TABLE program_term_courses ADD COLUMN legacy_semester_course_id integer;
--> statement-breakpoint
ALTER TABLE program_term_courses ADD COLUMN legacy_is_mandatory boolean;
--> statement-breakpoint
ALTER TABLE program_term_courses ADD COLUMN legacy_course_order integer;
--> statement-breakpoint
ALTER TABLE program_term_courses ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
ALTER TABLE program_term_courses ALTER COLUMN credits SET DEFAULT 3;
--> statement-breakpoint
CREATE INDEX program_term_courses_legacy_source_idx ON program_term_courses(program_term_id,legacy_semester_course_id)
 WHERE legacy_semester_course_id IS NOT NULL;
