-- [chat-14] Legacy verification provenance; does not authorize evidence access.
--> statement-breakpoint
ALTER TABLE profile_verifications ADD COLUMN legacy_student_id integer;
--> statement-breakpoint
ALTER TABLE profile_verifications ADD COLUMN legacy_verification_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_events ADD COLUMN legacy_event_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_events ADD COLUMN legacy_action varchar(64);
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN legacy_qualification_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN legacy_grading_type varchar(64);
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN legacy_earned_marks text;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN legacy_cgpa text;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN legacy_passing_year varchar(20);
