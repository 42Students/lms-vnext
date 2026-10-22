-- [chat-14] STAGED DB04 source-only provenance. DO NOT journal-register until DB04 parent education/image tables exist and same-owner receipt FK has been approved.
ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_qualification_id integer;
--> statement-breakpoint
ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_certificate_upload text;
--> statement-breakpoint
ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_start_year_raw varchar(32);
--> statement-breakpoint
ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_end_year_raw varchar(32);
--> statement-breakpoint
ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX learner_profile_education_legacy_source_idx ON learner_profile_education_entries(learner_membership_id,legacy_qualification_id) WHERE legacy_qualification_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE learner_profile_images ADD COLUMN legacy_image_id integer;
--> statement-breakpoint
ALTER TABLE learner_profile_images ADD COLUMN legacy_image_url text;
--> statement-breakpoint
ALTER TABLE learner_profile_images ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX learner_profile_images_legacy_source_idx ON learner_profile_images(learner_membership_id,legacy_image_id) WHERE legacy_image_id IS NOT NULL;
