-- Private scoped legacy identifiers for approved import and bookmark redirects.
-- Do not conflate them with global auth identity UID or roll number.
ALTER TABLE learner_profiles ADD COLUMN legacy_unique_id varchar(128);
--> statement-breakpoint
ALTER TABLE faculty_profiles ADD COLUMN legacy_faculty_code varchar(128);
