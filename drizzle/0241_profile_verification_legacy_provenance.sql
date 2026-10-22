-- [chat-14] Legacy verification provenance; does not authorize evidence access.
--> statement-breakpoint
ALTER TABLE profile_verifications ADD COLUMN IF NOT EXISTS legacy_student_id integer;
--> statement-breakpoint
ALTER TABLE profile_verifications ADD COLUMN IF NOT EXISTS legacy_verification_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_events ADD COLUMN IF NOT EXISTS legacy_event_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_events ADD COLUMN IF NOT EXISTS legacy_action varchar(64);
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN IF NOT EXISTS legacy_qualification_id integer;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN IF NOT EXISTS legacy_grading_type varchar(64);
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN IF NOT EXISTS legacy_earned_marks text;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN IF NOT EXISTS legacy_cgpa text;
--> statement-breakpoint
ALTER TABLE profile_verification_academic_marks ADD COLUMN IF NOT EXISTS legacy_passing_year varchar(20);
